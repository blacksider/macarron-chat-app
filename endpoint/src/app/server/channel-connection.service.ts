import {Injectable} from '@angular/core';
import {BiaMessageWebsocketSubject} from '../main/bia-message-websocket-subject';
import {AuthService} from '../auth/auth.service';
import {environment} from '../../environments/environment';
import {ChatServerUser} from './chat-server-users';

@Injectable()
export class ChannelConnectionService {
  private channelSocketSubject: BiaMessageWebsocketSubject<ArrayBuffer>;
  private inChannelUsers: ChatServerUser[] = [];

  constructor(private authService: AuthService) {
  }

  static defaultSerializer(value: ArrayBuffer) {
    return value;
  }

  static defaultDeserializer(e) {
    return new Int8Array(e.data);
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
    }
  }
}
