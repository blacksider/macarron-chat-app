import {ElementRef, Injectable} from '@angular/core';
import {WsConnectionService} from './ws-connection.service';
import {AuthService} from '../auth/auth.service';
import {BiaMessage, MESSAGE_FROM_USER, MESSAGE_TO_USER, MESSAGE_TYPE_ON_PASS_RTC_CONN, MessageFromUser, MessageToUser} from './bia-message';
import {byteArray2Str, strToUtf8Bytes} from './bia-message-websocket-subject';
import {ElectronService} from 'ngx-electron';

@Injectable()
export class RtcConnectionService {
  private pcConfig = {
    'iceServers': [{
      'urls': ['stun:stun.l.google.com:19302', 'stun:stun.xten.com']
    }]
  };
  private screenSharePc: RTCPeerConnection;
  private screenShare: ElementRef<HTMLDivElement>;
  private screenShareLocationStream: MediaStream;

  constructor(private wsConnService: WsConnectionService,
              private electron: ElectronService,
              private authService: AuthService) {
  }

  setScreenShareElement(screenShare: ElementRef<HTMLDivElement>) {
    this.screenShare = screenShare;
  }

  onIcecandidate(ev) {
    if (ev.candidate) {
      const message = {
        type: 'candidate',
        label: ev.candidate.sdpMLineIndex,
        id: ev.candidate.sdpMid,
        candidate: ev.candidate.candidate,
      };
      this.sendPcMessage(message);
    }
  }

  async createPeerConnection(isOffer: boolean) {
    this.screenSharePc = new RTCPeerConnection(this.pcConfig);
    this.screenSharePc.onicecandidate = this.onIcecandidate.bind(this);
    this.screenSharePc.ontrack = this.setRemoteStream.bind(this);
    this.screenSharePc.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent.bind(this);
    if (isOffer) {
      for (const track of this.screenShareLocationStream.getTracks()) {
        this.screenSharePc.addTrack(track, this.screenShareLocationStream);
      }

      const description = await this.screenSharePc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
      });
      await this.screenSharePc.setLocalDescription(description);

      this.sendPcMessage(this.screenSharePc.localDescription);
    }
  }

  private sendPcMessage(message) {
    let userId, username;
    if (this.wsConnService.requestForScreenShare && this.wsConnService.requestForScreenShare.requiring) {
      userId = this.wsConnService.requestForScreenShare.userId;
      username = this.wsConnService.requestForScreenShare.username;
    } else if (this.wsConnService.responseForScreenShare) {
      userId = this.wsConnService.responseForScreenShare.userId;
      username = this.wsConnService.responseForScreenShare.username;
    } else {
      return;
    }
    const messageData = {
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authService.authInfo.userId,
        username: this.authService.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_USER,
        userId: userId,
        username: username,
      } as MessageToUser,
      messageType: MESSAGE_TYPE_ON_PASS_RTC_CONN,
      message: strToUtf8Bytes(JSON.stringify(message))
    } as BiaMessage;
    this.wsConnService.getGlobalSocketSubject().send(messageData);
  }

  async parseScreenShareRTCMessage(value: BiaMessage) {
    const data = JSON.parse(byteArray2Str(value.message));
    switch (data.type) {
      case 'offer': {
        await this.screenSharePc.setRemoteDescription(new RTCSessionDescription(data));
        const description = await this.screenSharePc.createAnswer();
        await this.screenSharePc.setLocalDescription(description);
        this.sendPcMessage(this.screenSharePc.localDescription);
        break;
      }
      case 'answer': {
        await this.screenSharePc.setRemoteDescription(new RTCSessionDescription(data));
        break;
      }
      case 'candidate': {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
        });
        await this.screenSharePc.addIceCandidate(candidate);
        break;
      }
      default: {
        break;
      }
    }
  }

  async getDisplayMedia(handleStream) {
    const sources = await this.electron.desktopCapturer.getSources({types: ['window', 'screen']});
    const stream = await navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sources[0].id
          }
        }
      });
    handleStream(stream);
  }

  private setLocalStreamCallback(stream) {
    this.screenShareLocationStream = stream;
    this.screenShare.nativeElement.style.display = 'flex';
    this.screenShare.nativeElement.style.width = 800 + 'px';
    this.screenShare.nativeElement.style.height = 473 + 'px';
    this.screenShare.nativeElement.style.right = 0 + 'px';
    this.screenShare.nativeElement.style.bottom = 0 + 'px';
    const localStream = document.getElementById('local-stream') as HTMLVideoElement;
    localStream.style.display = 'block';
    const remoteStream = document.getElementById('remote-stream') as HTMLVideoElement;
    remoteStream.style.display = 'none';
    localStream.srcObject = this.screenShareLocationStream;
    localStream.play();
  }

  async setLocalStream() {
    await this.getDisplayMedia(this.setLocalStreamCallback.bind(this));
  }

  setRemoteStream(e: RTCTrackEvent) {
    const localStream = document.getElementById('local-stream') as HTMLVideoElement;
    localStream.style.display = 'none';
    const remoteStream = document.getElementById('remote-stream') as HTMLVideoElement;
    remoteStream.style.display = 'block';
    remoteStream.srcObject = e.streams[0];
    remoteStream.play();
    this.screenShare.nativeElement.style.display = 'flex';
    this.screenShare.nativeElement.style.width = 800 + 'px';
    this.screenShare.nativeElement.style.height = 473 + 'px';
    this.screenShare.nativeElement.style.right = 0 + 'px';
    this.screenShare.nativeElement.style.bottom = 0 + 'px';
  }

  closeConnection() {
    this.screenShare.nativeElement.style.width = 0 + 'px';
    this.screenShare.nativeElement.style.height = 0 + 'px';
    this.screenShare.nativeElement.style.display = 'none';
    const localStream = document.getElementById('local-stream') as HTMLVideoElement;
    const remoteStream = document.getElementById('remote-stream') as HTMLVideoElement;
    if (this.screenSharePc) {
      this.screenSharePc.ontrack = null;
      this.screenSharePc.onicecandidate = null;
      this.screenSharePc.oniceconnectionstatechange = null;
      if (localStream.srcObject) {
        for (const track of (localStream.srcObject as MediaStream).getTracks()) {
          track.stop();
        }
      }
      if (remoteStream.srcObject) {
        for (const track of (remoteStream.srcObject as MediaStream).getTracks()) {
          track.stop();
        }
      }
      this.screenSharePc.close();
      this.screenSharePc = null;
    }
    localStream.removeAttribute('srcObject');
    remoteStream.removeAttribute('srcObject');
  }

  handleICEConnectionStateChangeEvent(event) {
    switch (this.screenSharePc.iceConnectionState) {
      case 'closed':
      case 'failed':
      case 'disconnected':
        this.closeConnection();
        break;
    }
  }
}
