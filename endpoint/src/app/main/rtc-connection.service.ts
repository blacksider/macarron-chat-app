import {ElementRef, Injectable} from '@angular/core';
import {WsConnectionService} from './ws-connection.service';
import {AuthService} from '../auth/auth.service';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_ON_VOICE_RTC_CONN,
  MessageFromUser,
  MessageToUser
} from './bia-message';
import {byteArray2Str, strToUtf8Bytes} from './bia-message-websocket-subject';
import {ElectronService} from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class RtcConnectionService {
  private pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };
  private screenSharePc: RTCPeerConnection;
  private screenShare: ElementRef<HTMLDivElement>;
  private screenShareLocationStream: MediaStream;

  constructor(private wsConnService: WsConnectionService,
              private electron: ElectronService,
              private authService: AuthService) {
    this.wsConnService.isReady().subscribe(value => {
      if (value) {
        this.wsConnService.getGlobalSocketSubject().subscribe(_ => {
        });
      }
    });
  }

  setScreenShareElement(screenShare: ElementRef<HTMLDivElement>) {
    this.screenShare = screenShare;
  }

  createPeerConnection(isOffer: boolean) {
    this.screenSharePc = new RTCPeerConnection(this.pcConfig);
    this.screenSharePc.addEventListener('icecandidate', ev => {
      if (ev.candidate) {
        this.sendPcMessage({
          type: 'candidate',
          label: ev.candidate.sdpMLineIndex,
          id: ev.candidate.sdpMid,
          candidate: ev.candidate.candidate,
        });
      }
    });
    this.screenSharePc.ontrack = this.setRemoteStream;
    if (isOffer) {
      this.screenSharePc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
      }).then(description => {
        this.screenSharePc.setLocalDescription(description).then(() => {
          this.sendPcMessage(this.screenSharePc.localDescription);
        }).catch(this.logError);
      }).catch(this.logError);
    }
  }

  logError(e) {
    console.error(e);
  }

  private sendPcMessage(message) {
    const messageData = {
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authService.authInfo.userId,
        username: this.authService.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_USER,
        userId: this.wsConnService.requestForScreenShare.userId,
        username: this.wsConnService.requestForScreenShare.username,
      } as MessageToUser,
      messageType: MESSAGE_TYPE_ON_VOICE_RTC_CONN,
      message: strToUtf8Bytes(JSON.stringify(message))
    } as BiaMessage;
    console.log(this.wsConnService.getGlobalSocketSubject().id);
    this.wsConnService.getGlobalSocketSubject().send(messageData);
  }

  parseScreenShareRTCMessage(value: BiaMessage) {
    const data = JSON.parse(byteArray2Str(value.message));
    switch (data.type) {
      case 'offer': {
        this.screenSharePc.setRemoteDescription(new RTCSessionDescription(data)).then(() => {
          this.screenSharePc.createAnswer()
            .then(description => {
              this.screenSharePc.setLocalDescription(description).then(() => {
                this.sendPcMessage(this.screenSharePc.localDescription);
              }).catch(this.logError);
            }).catch(this.logError);
        }).catch(this.logError);
        break;
      }
      case 'answer': {
        this.screenSharePc.setRemoteDescription(new RTCSessionDescription(data)).then(() => {
        }).catch(this.logError);
        break;
      }
      case 'candidate': {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
        });
        this.screenSharePc.addIceCandidate(candidate).catch(this.logError);
        break;
      }
      default: {
        break;
      }
    }
  }

  getDisplayMedia(handleStream) {
    this.electron.desktopCapturer.getSources({types: ['window', 'screen']}).then(sources => {
      for (let i = 0; i < sources.length; ++i) {
        if (sources[i].name === 'Electron') {
          navigator.mediaDevices
            .getUserMedia({
              audio: false,
              video: {
                // @ts-ignore
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: sources[i].id,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720
                }
              }
            })
            .then((stream) => handleStream(stream))
            .catch(this.logError);
        }
      }
    }).catch(this.logError);
  }

  setLocalStream() {
    this.getDisplayMedia((stream) => {
      this.screenShareLocationStream = stream;
      this.screenShare.nativeElement.style.width = 300 + 'px';
      this.screenShare.nativeElement.style.height = 300 + 'px';
      const localStream = document.getElementById('local-stream') as HTMLVideoElement;
      localStream.srcObject = this.screenShareLocationStream;
    });
  }

  setRemoteStream(e: RTCTrackEvent) {
    const remoteStream = document.getElementById('remote-stream') as HTMLVideoElement;
    remoteStream.srcObject = null;
    remoteStream.srcObject = e.streams[0];
    this.screenShare.nativeElement.style.width = 300 + 'px';
    this.screenShare.nativeElement.style.height = 300 + 'px';
  }
}
