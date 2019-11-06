import {EventEmitter, Injectable} from '@angular/core';
import {BiaMessageWebsocketSubject, byteArray2Str, str2ByteArray, utf8ByteToUnicodeStr} from './bia-message-websocket-subject';
import {AuthService} from '../auth/auth.service';
import {BiaMessage, MESSAGE_TYPE_START_CHAT, MessageFromUser, MessageToServerChannel} from './bia-message';
import {merge, Observable, of} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {ServerUser} from '../server/chat-server-users';

function convertBase64ToBinary(base64) {
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Int8Array(new ArrayBuffer(rawLength));
  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

export class RequestForScreenShare {
  requiring: boolean;
  userId: number;
  username: string;
  at: Date;
  timeoutHandle: any;

  static require(userId: number, username: string, onTimeout?): RequestForScreenShare {
    const data = new RequestForScreenShare();
    data.requiring = true;
    data.userId = userId;
    data.username = username;
    data.at = new Date();
    data.timeoutHandle = setTimeout(() => {
      data.requiring = false;
      if (onTimeout) {
        onTimeout();
      }
    }, 30000);
    return data;
  }
}

export class ResponseForScreenShare {
  userId: number;
  at: Date;

  static accept(userId: number): ResponseForScreenShare {
    const data = new ResponseForScreenShare();
    data.userId = userId;
    data.at = new Date();
    return data;
  }
}

@Injectable({
  providedIn: 'root'
})
export class WsConnectionService {
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  private ready = new EventEmitter<boolean>();

  private channelMessages: Map<number, BiaMessage[]> = new Map<number, BiaMessage[]>();
  private channelMessagesChange = new EventEmitter<Map<number, BiaMessage[]>>();

  private fromUserMessages: Map<number, BiaMessage[]> = new Map<number, BiaMessage[]>();
  private fromUserMessagesChange = new EventEmitter<Map<number, BiaMessage[]>>();

  private inChannelPlayers: Map<number, ServerUser[]> = new Map<number, ServerUser[]>();
  private inChannelPlayersChange = new EventEmitter<Map<number, ServerUser[]>>();

  requestForScreenShare: RequestForScreenShare;
  responseForScreenShare: ResponseForScreenShare;

  constructor(private authService: AuthService) {
  }

  connectGlobalSubject(token: string): BiaMessageWebsocketSubject<BiaMessage> {
    const url = `${environment.wsAddr}/ws/connect`;
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

  addFromUserStartChatMessage(tempMessageFrom: MessageFromUser) {
    let messages;
    if (this.fromUserMessages.has(tempMessageFrom.userId)) {
      messages = this.fromUserMessages.get(tempMessageFrom.userId);
      if (messages.length > 0 && messages[0].messageFrom['userId'] === tempMessageFrom.userId) {
        return;
      }
    } else {
      messages = [];
      this.fromUserMessages.set(tempMessageFrom.userId, messages);
    }
    const tempMessage = new BiaMessage();
    tempMessage.messageType = MESSAGE_TYPE_START_CHAT;
    tempMessage.messageFrom = tempMessageFrom;
    messages.push(tempMessage);
    this.fromUserMessagesChange.emit(this.fromUserMessages);
  }

  addFromUserMessage(value: BiaMessage, fromUserId) {
    let messages;
    if (!this.fromUserMessages.has(fromUserId)) {
      messages = [];
      this.fromUserMessages.set(fromUserId, messages);
    } else {
      messages = this.fromUserMessages.get(fromUserId);
    }
    messages.push(value);
    this.fromUserMessagesChange.emit(this.fromUserMessages);
  }

  getFromUserMessage(userId: number): Observable<BiaMessage[]> {
    const messageChangeObv = this.fromUserMessagesChange.pipe(
      map(messages => {
        if (messages.has(userId)) {
          return messages.get(userId);
        }
        return null;
      }),
      filter(messages => !!messages)
    );
    if (this.fromUserMessages.has(userId)) {
      return merge(of(this.fromUserMessages.get(userId)), messageChangeObv);
    }
    return messageChangeObv;
  }

  removeFromUserMessage(userId: number) {
    if (this.fromUserMessages.has(userId)) {
      this.fromUserMessages.delete(userId);
      this.fromUserMessagesChange.emit(this.fromUserMessages);
    }
  }

  private mapFromUserMessageUsers(messages: Map<number, BiaMessage[]>): MessageFromUser[] {
    const users = [];
    for (const key of messages.keys()) {
      if (messages.get(key).length > 0) {
        users.push(messages.get(key)[0].messageFrom as MessageFromUser);
      }
    }
    return users;
  }

  getFromUserMessageUsers(): Observable<MessageFromUser[]> {
    const messageChangeObv = this.fromUserMessagesChange.pipe(
      map(messages => {
        return this.mapFromUserMessageUsers(messages);
      })
    );
    return merge(of(this.mapFromUserMessageUsers(this.fromUserMessages)), messageChangeObv);
  }

  initUserInChannel(channelUsers: { [key: string]: ServerUser[] }) {
    // tslint:disable-next-line:forin
    for (const channelIdStr in channelUsers) {
      const channelId = parseInt(channelIdStr, 10);
      this.inChannelPlayers.set(channelId, channelUsers[channelIdStr]);
    }
  }

  addUserToChannel(value: BiaMessage) {
    const messageTo = value.messageTo as MessageToServerChannel;
    let users;
    if (!this.inChannelPlayers.has(messageTo.channelId)) {
      users = [];
      this.inChannelPlayers.set(messageTo.channelId, users);
    } else {
      users = this.inChannelPlayers.get(messageTo.channelId);
    }
    const user = JSON.parse(byteArray2Str(value.message)) as ServerUser;
    const findIdx = users.findIndex(res => {
      return res.id === user.id;
    });
    if (findIdx !== -1) {
      users.splice(findIdx, 1, user);
    } else {
      users.push(user);
    }
    this.inChannelPlayersChange.emit(this.inChannelPlayers);
  }

  getUserInChannel(userId: number): number {
    let players;
    for (const channelId of this.inChannelPlayers.keys()) {
      players = this.inChannelPlayers.get(channelId);
      if (!!players && players.length > 0) {
        const idx = players.findIndex(value => value.id === userId);
        if (idx !== -1) {
          return channelId;
        }
      }
    }
    return null;
  }

  getUsersOfChannel(channelId: number): Observable<ServerUser[]> {
    const messageChangeObv = this.inChannelPlayersChange.pipe(
      map(users => {
        if (users.has(channelId)) {
          return users.get(channelId);
        }
        return null;
      })
    );
    if (this.inChannelPlayers.has(channelId)) {
      return merge(of(this.inChannelPlayers.get(channelId)), messageChangeObv);
    }
    return messageChangeObv;
  }

  removeUserInChannel(channelId: number, userId: number) {
    if (this.inChannelPlayers.has(channelId)) {
      const users = this.inChannelPlayers.get(channelId);
      const idx = users.findIndex(value => value.id === userId);
      if (idx !== -1) {
        users.splice(idx, 1);
      }
      this.inChannelPlayersChange.emit(this.inChannelPlayers);
    }
  }

  setOnRequestForScreenShare(userId: number, username: string) {
    if (this.requestForScreenShare) {
      clearTimeout(this.requestForScreenShare.timeoutHandle);
    }
    this.requestForScreenShare = RequestForScreenShare.require(userId, username);
  }

  acceptResponseForScreenShare(userId: number, accept: boolean) {
    if (accept) {
      this.responseForScreenShare = ResponseForScreenShare.accept(userId);
    } else {
      this.responseForScreenShare = null;
    }
  }
}
