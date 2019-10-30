import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit {
  defaultId = 'default';

  defaultAudioInput: MediaDeviceInfo;
  defaultAudioOutput: MediaDeviceInfo;

  audioInputs: MediaDeviceInfo[] = [];
  audioOutputs: MediaDeviceInfo[] = [];

  videoInputs: MediaDeviceInfo[] = [];

  selectedAudioInput: any;
  selectedAudioOutput: any;
  selectedVideoInput: MediaDeviceInfo = null;

  constructor() {
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
      this.start();
    });
  }

  gotStream(stream) {
    window['stream'] = stream;
  }

  start() {
    if (window['stream']) {
      window['stream'].getTracks().forEach(track => {
        track.stop();
      });
    }
    let audioSource = null;
    if (this.selectedAudioInput === this.defaultId) {
      if (!!this.defaultAudioInput) {
        audioSource = this.selectedAudioInput;
      }
    } else {
      audioSource = this.selectedAudioInput.deviceId;
    }
    const videoSource = this.selectedVideoInput ? this.selectedVideoInput.deviceId : null;
    const constraints = {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };
    navigator.mediaDevices.getUserMedia(constraints).then(this.gotStream).catch(this.handleError);
  }

  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }
}
