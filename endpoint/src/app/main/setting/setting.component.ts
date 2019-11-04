import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SoundMeter} from './sound-meter';
import {ToastrService} from 'ngx-toastr';
import {__await} from 'tslib';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild('instant', {static: true}) instant: ElementRef<HTMLMeterElement>;
  @ViewChild('audioEcho', {static: true}) audioEcho: ElementRef<HTMLAudioElement>;

  defaultId = 'default';

  defaultAudioInput: MediaDeviceInfo;
  defaultAudioOutput: MediaDeviceInfo;

  audioInputs: MediaDeviceInfo[] = [];
  audioOutputs: MediaDeviceInfo[] = [];

  videoInputs: MediaDeviceInfo[] = [];

  selectedAudioInput: any;
  selectedAudioOutput: any;
  selectedVideoInput: MediaDeviceInfo = null;
  testAudio = false;
  testAudioSoundMeter: SoundMeter;
  testAudioInterval: any;

  constructor(private toastr: ToastrService) {
  }

  ngOnDestroy(): void {
    if (!!this.testAudioInterval) {
      clearInterval(this.testAudioInterval);
    }
    if (!!this.testAudioSoundMeter) {
      this.testAudioSoundMeter.stop();
    }
  }

  ngOnInit() {
    this.selectedAudioInput = this.defaultId;
    this.selectedAudioOutput = this.defaultId;

    navigator.mediaDevices.enumerateDevices().then(values => {
      values.forEach(value => {
        if (value.deviceId === 'communications') {
          // don't resolve 'communications' device
          return;
        }
        switch (value.kind) {
          case 'audioinput':
            if (value.deviceId === this.defaultId) {
              this.defaultAudioInput = value;
              return;
            }
            this.audioInputs.push(value);
            break;
          case 'audiooutput':
            if (value.deviceId === this.defaultId) {
              this.defaultAudioOutput = value;
              return;
            }
            this.audioOutputs.push(value);
            break;
          case 'videoinput':
            this.videoInputs.push(value);
            break;
          default:
            break;
        }
      });
    });
  }

  getAudioConstraints() {
    if (window['stream']) {
      window['stream'].getTracks().forEach(track => {
        track.stop();
      });
    }
    let audioSource = null;
    if (this.selectedAudioInput === this.defaultId) {
      if (!!this.defaultAudioInput) {
        audioSource = this.selectedAudioInput;
      } else {
        return;
      }
    } else {
      audioSource = this.selectedAudioInput.deviceId;
    }
    const videoSource = this.selectedVideoInput ? this.selectedVideoInput.deviceId : null;
    return {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
  }

  audioInputChanged() {
  }

  doTestAudio() {
    this.testAudio = !this.testAudio;
    if (this.testAudio) {
      const constraints = this.getAudioConstraints();
      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.gotEchoStream.bind(this))
        .catch(this.handleTestError.bind(this));
    } else {
      this.stopTestAudio();
    }
  }

  gotEchoStream(stream: MediaStream) {
    window['stream'] = stream;
    const soundMeter = new SoundMeter(new AudioContext());
    const that = this;
    soundMeter.connectToSource(stream, function (e) {
      if (e) {
        console.log(e);
        return;
      }
      if (!!that.testAudioInterval) {
        clearInterval(that.testAudioInterval);
      }
      that.testAudioInterval = setInterval(() => {
        that.instant.nativeElement.value = Number.parseFloat(soundMeter.instant.toFixed(2));
      }, 100);
    });
    this.testAudioSoundMeter = soundMeter;
    this.audioEcho.nativeElement.srcObject = stream;
  }

  private handleTestError(error) {
    this.toastr.warning('无法测试麦克风，请检查麦克风是否有效');
    console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    this.testAudio = false;
    this.stopTestAudio();
  }

  private stopTestAudio() {
    if (this.testAudioSoundMeter) {
      this.testAudioSoundMeter.stop();
      this.audioEcho.nativeElement.srcObject = null;
    }
  }
}
