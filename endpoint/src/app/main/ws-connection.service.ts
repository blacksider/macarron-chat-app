import {EventEmitter, Injectable} from '@angular/core';
import {BiaMessageWebsocketSubject, str2ByteArray, utf8ByteToUnicodeStr} from './bia-message-websocket-subject';
import {AuthService} from '../auth/auth.service';
import {BiaMessage, MessageToServerChannel} from './bia-message';
import {merge, Observable, of} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {environment} from '../../environments/environment';

function convertBase64ToBinary(base64) {
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Int8Array(new ArrayBuffer(rawLength));
  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

@Injectable()
export class WsConnectionService {
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  private ready = new EventEmitter<boolean>();
  private channelMessages: Map<number, BiaMessage[]> = new Map<number, BiaMessage[]>();
  private channelMessagesChange = new EventEmitter<Map<number, BiaMessage[]>>();

  constructor(private authService: AuthService) {
  }

  connectGlobalSubject(token: string): BiaMessageWebsocketSubject<BiaMessage> {
    const url = `ws://${environment.wsAddr}/ws/connect`;
    this.globalSocketSubject = new BiaMessageWebsocketSubject<BiaMessage>(url, token, this.authService, null, e => {
      // default received data is encoded by utf8, need to decode to unicode str
      const arr = new Int8Array(e.data);
      const json = JSON.parse(utf8ByteToUnicodeStr(arr));
      const int8Arr = convertBase64ToBinary(json.message);
      const message = utf8ByteToUnicodeStr(int8Arr);
      json.message = str2ByteArray(message);
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

  isReady(): Observable<boolean> {
    if (this.globalSocketSubject && this.globalSocketSubject.isReady) {
      return of(this.globalSocketSubject.isReady);
    }
    return this.ready;
  }

  addChannelMessage(value: BiaMessage) {
    const messageTo = value.messageTo as MessageToServerChannel;
    let messages;
    if (!this.channelMessages.has(messageTo.channelId)) {
      messages = [];
      this.channelMessages.set(messageTo.channelId, messages);
    } else {
      messages = this.channelMessages.get(messageTo.channelId);
    }
    messages.push(value);
    this.channelMessagesChange.emit(this.channelMessages);
  }

  getChannelMessage(channelId: number): Observable<BiaMessage[]> {
    const messageChangeObv = this.channelMessagesChange.pipe(
      map(messages => {
        if (messages.has(channelId)) {
          return messages.get(channelId);
        }
        return null;
      }),
      filter(messages => !!messages)
    );
    if (this.channelMessages.has(channelId)) {
      return merge(of(this.channelMessages.get(channelId)), messageChangeObv);
    }
    return messageChangeObv;
  }
}
