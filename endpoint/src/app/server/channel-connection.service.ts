import {Injectable} from '@angular/core';
import {BiaMessageWebsocketSubject} from '../main/bia-message-websocket-subject';
import {AuthService} from '../auth/auth.service';
import {environment} from '../../environments/environment';
import {ChatServerUser} from './chat-server-users';
import {SettingService} from '../main/setting.service';
import {MESSAGE_TYPE_VOICE_MESSAGE} from './channel-message';

@Injectable({
  providedIn: 'root'
})
export class ChannelConnectionService {
  private channelSocketSubject: BiaMessageWebsocketSubject<ArrayBuffer>;
  private inChannelUsers: ChatServerUser[] = [];
  private defaultId = 'default';
  private audioContext = new AudioContext();
  private stream: MediaStream;
  private audioInput: MediaStreamAudioSourceNode;
  private recorderGainNode: GainNode;
  private recorder: ScriptProcessorNode;
  private talking = false;
  private muted = false;

  private messageBufferSize = 2048;


  private silence = new Float32Array(this.messageBufferSize);
  private audioQueue = {
    buffer: new Float32Array(0),

    write: function (newAudio) {
      const currentQLength = this.buffer.length;
      const newBuffer = new Float32Array(currentQLength + newAudio.length);
      newBuffer.set(this.buffer, 0);
      newBuffer.set(newAudio, currentQLength);
      this.buffer = newBuffer;
    },

    read: function (nSamples) {
      const samplesToPlay = this.buffer.subarray(0, nSamples);
      this.buffer = this.buffer.subarray(nSamples, this.buffer.length);
      return samplesToPlay;
    },

    length: function () {
      return this.buffer.length;
    }
  };
  private playAudioContext = new AudioContext();
  private playAudio: HTMLAudioElement;
  private playNode: ScriptProcessorNode;
  private playSource: MediaElementAudioSourceNode;
  private playGainNode: GainNode;

  constructor(private authService: AuthService,
              private settingService: SettingService) {
  }

  static defaultSerializer(value: ArrayBuffer) {
    return value;
  }

  static defaultDeserializer(e) {
    return new Int8Array(e.data);
  }

  connect(channelId: number) {
    this.authService.getAuthorizationToken().subscribe(token => {
      this.connectChannelSubject(channelId, token).subscribe(value => {
        this.handleChannelMessage(value);
      });
      this.playAudioData();
    });
  }

  playAudioData() {
    this.playAudio = document.createElement('audio') as HTMLAudioElement;
    let sinkId;
    if (this.settingService.selectedAudioOutput === this.defaultId) {
      sinkId = this.defaultId;
    } else {
      sinkId = this.settingService.selectedAudioOutput.deviceId;
    }
    // @ts-ignore
    this.playAudio.setSinkId(sinkId).then(() => {
      this.playSource = this.playAudioContext.createMediaElementSource(this.playAudio);
      this.playNode = this.playAudioContext.createScriptProcessor(this.messageBufferSize, 1, 1);
      this.playNode.addEventListener('audioprocess', e => {
        if (this.audioQueue.length()) {
          e.outputBuffer.getChannelData(0).set(this.audioQueue.read(this.messageBufferSize));
        } else {
          e.outputBuffer.getChannelData(0).set(this.silence);
        }
      });
      this.playGainNode = this.playAudioContext.createGain();
      this.playSource.connect(this.playGainNode);
      this.playGainNode.connect(this.playNode);
      this.playNode.connect(this.playAudioContext.destination);
    });
  }

  stopPlayAudio() {
    if (this.playSource) {
      this.playSource.disconnect();
      this.playSource = null;
    }
    if (this.playGainNode) {
      this.playGainNode.disconnect();
      this.playGainNode = null;
    }
    if (this.playNode) {
      this.playNode.disconnect();
      this.playNode = null;
    }
    if (this.playAudio) {
      this.playAudio.remove();
    }
  }

  private handleChannelMessage(value: ArrayBuffer) {
    const type = this.getInt(new Int8Array(value));
    switch (type) {
      case MESSAGE_TYPE_VOICE_MESSAGE: {
        const data = value.slice(4);
        this.audioQueue.write(new Float32Array(new Int8Array(data).buffer));
        break;
      }
    }
  }

  connectChannelSubject(channelId: number, token: string): BiaMessageWebsocketSubject<ArrayBuffer> {
    const url = `${environment.wsAddr}/ws/channel?channelId=${channelId}`;
    this.channelSocketSubject = new BiaMessageWebsocketSubject<ArrayBuffer>(
      url, token, this.authService,
      ChannelConnectionService.defaultSerializer,
      ChannelConnectionService.defaultDeserializer);
    return this.channelSocketSubject;
  }

  getChannelSubject(): BiaMessageWebsocketSubject<ArrayBuffer> {
    return this.channelSocketSubject;
  }

  closeAll() {
    if (this.channelSocketSubject) {
      this.channelSocketSubject.complete();
      this.channelSocketSubject = null;
      this.stopSendAudio();
      this.stopPlayAudio();
    }
  }

  getAudioConstraints() {
    if (window['stream']) {
      window['stream'].getTracks().forEach(track => {
        track.stop();
      });
    }
    let audioSource;
    if (this.settingService.selectedAudioInput === this.defaultId) {
      audioSource = this.settingService.selectedAudioInput;
    } else {
      audioSource = this.settingService.selectedAudioInput.deviceId;
    }
    return {
      audio: {deviceId: audioSource ? {exact: audioSource} : undefined}
    };
  }

  streamAudio(stream: MediaStream) {
    // window['stream'] = stream;
    this.stream = stream;
    this.audioInput = this.audioContext.createMediaStreamSource(stream);
    this.recorderGainNode = this.audioContext.createGain();
    this.recorder = this.audioContext.createScriptProcessor(this.messageBufferSize, 1, 1);
    this.recorder.addEventListener('audioprocess', this.onaudioprocess.bind(this));
    this.audioInput.connect(this.recorderGainNode);
    this.recorderGainNode.connect(this.recorder);
    this.recorder.connect(this.audioContext.destination);
  }

  onaudioprocess(event: AudioProcessingEvent) {
    const typeBuffer = this.intToBytes(MESSAGE_TYPE_VOICE_MESSAGE);
    const type = new Int8Array(typeBuffer);
    const input = event.inputBuffer.getChannelData(0);
    const inputData = new Int8Array(input.buffer);
    const tmp = new Uint8Array(type.length + inputData.length);
    tmp.set(type, 0);
    tmp.set(inputData, type.length);
    this.channelSocketSubject.send(tmp.buffer);
  }

  intToBytes(num) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, num, false);
    return arr;
  }

  getInt(arr: Int8Array) {
    const view = new DataView(arr.buffer);
    return view.getInt32(0, false);
  }

  private handleSendError(error) {
    console.error('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  startSendAudio() {
    if (!this.channelSocketSubject) {
      return;
    }
    if (this.talking) {
      return;
    }
    this.talking = true;
    const constraints = this.getAudioConstraints();
    navigator.mediaDevices.getUserMedia(constraints)
      .then(this.streamAudio.bind(this))
      .catch(this.handleSendError.bind(this));
  }

  mute() {
    this.setMute(true);
  }

  unMute() {
    this.setMute(false);
  }

  private setMute(muted: boolean) {
    this.muted = muted;
    if (this.talking) {
      if (this.muted) {
        this.recorderGainNode.gain.value = 0;
      } else {
        this.recorderGainNode.gain.value = 1;
      }
    }
  }

  stopSendAudio() {
    if (!this.talking) {
      return;
    }
    this.talking = false;
    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }
    if (this.recorderGainNode) {
      this.recorderGainNode.disconnect();
      this.recorderGainNode = null;
    }
    if (this.recorder) {
      this.recorder.disconnect();
      this.recorder = null;
    }
    if (this.stream) {
      this.stream.getTracks()[0].stop();
      this.stream = null;
    }
  }
}
