import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SoundMeter} from './sound-meter';
import {WsConnectionService} from '../ws-connection.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_ON_VOICE_RTC_CONN,
  MessageFromUser,
  MessageToUser
} from '../bia-message';
import {BiaMessageWebsocketSubject, byteArray2Str, strToUtf8Bytes} from '../bia-message-websocket-subject';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {RequireRtcConnection} from './require-rtc-connection';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.less']
})
export class SettingComponent implements OnInit, OnDestroy {
  @ViewChild('instant', {static: true}) instant: ElementRef<HTMLMeterElement>;
  @ViewChild('audioEcho', {static: true}) audioEcho: ElementRef<HTMLAudioElement>;
  @ViewChild('localAudio', {static: true}) localAudio: ElementRef<HTMLAudioElement>;
  @ViewChild('remoteAudio', {static: true}) remoteAudio: ElementRef<HTMLAudioElement>;

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

  // TODO
  configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    } as RTCIceServer]
  } as RTCConfiguration;
  offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  } as RTCOfferOptions;
  unSubscribe = new Subject();
  globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  authInfo: AuthInfo;
  localStream: MediaStream;
  remoteStream: MediaStream;
  peerList = {};

  startAction(callback?) {
    navigator.mediaDevices.getUserMedia(this.getAudioConstraints()).then(steam => {
      this.gotLocalMediaStream(steam, callback);
    }).catch(this.logError);
  }

  gotLocalMediaStream(stream, callback?) {
    this.localAudio.nativeElement.srcObject = stream;
    this.localStream = stream;
    window['localStream'] = stream;
    if (callback && typeof callback === 'function') {
      callback();
    }
  }

  handleRemoteMediaStreamAdded(pc, event) {
    this.remoteStream = event.stream;
    this.remoteAudio.nativeElement.srcObject = event.stream;
    this.remoteAudio.nativeElement.addEventListener('loadedmetadata', () => {
      this.remoteAudio.nativeElement.play().then(_ => {
      });
    });
  }

  sendPcMessage(message: any) {
    console.log(this);
    const fromMe = this.getFromMe();
    const toMe = {
      type: MESSAGE_TO_USER,
      userId: this.authInfo.userId,
      username: this.authInfo.username
    } as MessageToUser;
    this.globalSocketSubject.send({
      messageFrom: fromMe,
      messageTo: toMe,
      time: new Date().getTime(),
      messageType: MESSAGE_TYPE_ON_VOICE_RTC_CONN,
      message: strToUtf8Bytes(JSON.stringify(message))
    } as BiaMessage);
  }

  signalingMessageCallback(value: BiaMessage) {
    const pc = this.peerList[value.messageFrom['userId']];
    const message = JSON.parse(byteArray2Str(value.message));
    switch (message['type']) {
      case 'candidate': {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate).catch(err => {
          console.log('addIceCandidate-error', err);
        });
        break;
      }
      case 'offer': {
        pc.setRemoteDescription(new RTCSessionDescription(message)).then(() => {
          pc.createAnswer()
            .then((description) => this.createdAnswerSuccess(pc, description))
            .catch(this.logError);
        }).catch(this.logError);
        break;
      }
      case 'answer': {
        pc.setRemoteDescription(new RTCSessionDescription(message))
          .catch(this.logError);
        break;
      }
    }
  }

  createdAnswerSuccess(pc, description) {
    pc.setLocalDescription(description)
      .then(() => {
        this.sendPcMessage(pc.localDescription);
      })
      .catch(this.logError);
  }

  createPeerConnection(isCreatedOffer, other) {
    // TODO
    if (!this.peerList[other.userId]) {
      const pc = new RTCPeerConnection(this.configuration);
      this.peerList[other.userId] = pc;
      this.createConnect(isCreatedOffer, pc);
    }
  }

  onicecandidate(ev) {
    if (ev.candidate) {
      const requirement = new RequireRtcConnection();
      requirement.type = 'candidate';
      requirement.label = ev.candidate.sdpMLineIndex;
      requirement.id = ev.candidate.sdpMid;
      requirement.candidate = ev.candidate.candidate;
      this.sendPcMessage(requirement);
    }
  }

  createConnect(isCreatedOffer, pc: RTCPeerConnection) {
    pc.addEventListener('icecandidate', this.onicecandidate.bind(this));
    if (this.localStream) {
      pc.addTrack(this.localStream.getTracks()[0], this.localStream);
    } else {
      this.startAction(() => {
        pc.addTrack(this.localStream.getTracks()[0], this.localStream);
      });
    }
    pc.addEventListener('addstream', (event) => {
      this.handleRemoteMediaStreamAdded(pc, event);
    });
    if (isCreatedOffer) {
      pc.createOffer(this.offerOptions)
        .then((description) => this.createdOfferSuccess(pc, description))
        .catch(this.logError);
    }
  }

  createdOfferSuccess(pc, description) {
    // 用sd生成localPc的本地描述，remotePc的远程描述
    pc.setLocalDescription(description)
      .then(() => {

        const fromMe = this.getFromMe();

        const toMe = {
          type: MESSAGE_TO_USER,
          userId: this.authInfo.userId,
          username: this.authInfo.username
        } as MessageToUser;

        this.globalSocketSubject.send({
          messageFrom: fromMe,
          messageTo: toMe,
          time: new Date().getTime(),
          messageType: MESSAGE_TYPE_ON_VOICE_RTC_CONN,
          message: strToUtf8Bytes(JSON.stringify(pc.localDescription))
        } as BiaMessage);
      }).catch(this.logError);
  }

  startRTC() {
    // TODO other should change to room users
    this.createPeerConnection(true, this.authInfo);

    console.log(this.globalSocketSubject);
    this.globalSocketSubject.subscribe(value => {
      if (value.messageType === MESSAGE_TYPE_ON_VOICE_RTC_CONN) {
        this.signalingMessageCallback(value);
      }
    });
  }

  logError(err) {
    if (!err) {
      return;
    }
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      console.warn(err.toString(), err);
    }
  }

  private getFromMe(): MessageFromUser {
    return {
      type: MESSAGE_FROM_USER,
      userId: this.authInfo.userId,
      username: this.authInfo.username
    } as MessageFromUser;
  }

  constructor(private wsConnService: WsConnectionService,
              private authService: AuthService) {
  }

  ngOnDestroy(): void {
    if (!!this.testAudioInterval) {
      clearInterval(this.testAudioInterval);
    }
    if (!!this.testAudioSoundMeter) {
      this.testAudioSoundMeter.stop();
    }
    if (this.unSubscribe) {
      this.unSubscribe.next();
      this.unSubscribe.complete();
    }
  }

  ngOnInit() {
    this.wsConnService.isReady()
      .pipe(
        takeUntil(this.unSubscribe)
      )
      .subscribe(ready => {
        if (ready) {
          this.globalSocketSubject = this.wsConnService.getGlobalSocketSubject();
          console.log(this.globalSocketSubject);
        }
      });
    this.authInfo = this.authService.authInfo;

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

  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  audioInputChanged() {
  }

  doTestAudio() {
    this.testAudio = !this.testAudio;
    if (this.testAudio) {
      const constraints = this.getAudioConstraints();
      navigator.mediaDevices.getUserMedia(constraints)
        .then(this.gotEchoStream.bind(this))
        .catch(this.handleError);
    } else {
      if (this.testAudioSoundMeter) {
        this.testAudioSoundMeter.stop();
        this.audioEcho.nativeElement.srcObject = null;
      }
    }
  }
}
