import {EventEmitter, Injectable} from '@angular/core';
import {arrayBuffer2Str, BiaMessageWebsocketSubject, str2ByteArray} from './bia-message-websocket-subject';
import {AuthService} from '../auth/auth.service';
import {BiaMessage} from './bia-message';

@Injectable()
export class WsConnectionService {
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  private ready = new EventEmitter<boolean>();

  constructor(private authService: AuthService) {
  }

  connectGlobalSubject(token: string): BiaMessageWebsocketSubject<BiaMessage> {
    const url = `ws://${location.host}/ws/connect`;
    this.globalSocketSubject = new BiaMessageWebsocketSubject<BiaMessage>(url, token, this.authService, null, e => {
      const json = JSON.parse(arrayBuffer2Str(e.data));
      json.message = str2ByteArray(atob(json.message));
      return json;
    });
    this.globalSocketSubject.ready.subscribe(ready => {
      this.ready.emit(ready);
    });
    return this.globalSocketSubject;
  }

  getGlobalSocketSubject(): BiaMessageWebsocketSubject<BiaMessage> {
    return this.globalSocketSubject;
  }

  isReady(): EventEmitter<boolean> {
    return this.ready;
  }
}
