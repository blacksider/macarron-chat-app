import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerInfoService} from '../server-info.service';
import {ActivatedRoute} from '@angular/router';
import {ChatServerChannel} from '../chat-server-channel';
import {ChatServer} from '../chat-server';
import {BiaMessageWebsocketSubject, byteArray2Str, strToUtf8Bytes, utf8ByteToUnicodeStr} from '../../main/bia-message-websocket-subject';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_SERVER_CHANNEL,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVER_CHANNELS,
  MESSAGE_TYPE_TEXT,
  MessageFromUser,
  MessageToServerChannel,
  MessageToUser
} from '../../main/bia-message';
import {WsConnectionService} from '../../main/ws-connection.service';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-server-info',
  templateUrl: './server-info.component.html',
  styleUrls: ['./server-info.component.less']
})
export class ServerInfoComponent implements OnInit, OnDestroy {
  @ViewChild('inputMsg', {static: true}) inputMsgControl: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageContainer', {static: true}) messageContainer: ElementRef<any>;
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  serverInfo: ChatServer;
  channels: ChatServerChannel[];
  currentChannel: ChatServerChannel;
  connected = false;
  authInfo: AuthInfo;
  unSubscribe: Subject<any>;
  channelMessageSub: any;
  channelMessages: BiaMessage[];

  constructor(private svrService: ServerInfoService,
              private connService: WsConnectionService,
              private route: ActivatedRoute,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (this.unSubscribe) {
        this.unSubscribe.next();
        this.unSubscribe.complete();
        this.unSubscribe = null;
      }
      this.currentChannel = null;
      this.connected = false;
      this.channelMessages = null;
      this.unSubscribe = new Subject();
      this.authInfo = this.authService.authInfo;
      const serverId = parseInt(paramMap.get('id'), 10);
      this.svrService.getServer(serverId)
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(value => {
          this.serverInfo = value;
        });
      this.svrService.getChannels(serverId)
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(value => {
          this.channels = value;
          if (!this.currentChannel) {
            this.connectTo(this.channels[0]);
          }
        });
      this.connService.isReady()
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(ready => {
          if (ready) {
            this.globalSocketSubject = this.connService.getGlobalSocketSubject();
            this.globalSocketSubject.send({
              messageFrom: {
                type: MESSAGE_FROM_USER,
                userId: this.authInfo.userId,
                username: this.authInfo.username
              } as MessageFromUser,
              messageTo: {
                type: MESSAGE_TO_USER,
                userId: this.authInfo.userId,
                username: this.authInfo.username
              } as MessageToUser,
              time: new Date().getTime(),
              messageType: MESSAGE_TYPE_GET_SERVER_CHANNELS,
              message: strToUtf8Bytes(serverId + '')
            } as BiaMessage);
          }
        });
    });
  }

  ngOnDestroy(): void {
    if (this.unSubscribe) {
      this.unSubscribe.next();
      this.unSubscribe.complete();
    }
  }

  parseTextMessage(message: number[]) {
    return byteArray2Str(message);
  }

  connectTo(channel: ChatServerChannel) {
    if (!!this.currentChannel && this.currentChannel.id === channel.id) {
      return;
    }
    this.currentChannel = channel;
    this.connected = true;
    if (this.channelMessageSub) {
      this.channelMessageSub.unsubscribe();
    }
    this.channelMessageSub = this.connService
      .getChannelMessage(this.currentChannel.id)
      .subscribe(messages => {
        this.channelMessages = messages;
        setTimeout(() => {
          const elem = this.messageContainer.nativeElement;
          elem.scrollTop = elem.scrollHeight - elem.clientHeight;
        });
      });
  }

  isInChannel(channel: ChatServerChannel) {
    return this.currentChannel === channel;
  }

  sendMessage() {
    this.globalSocketSubject.send({
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authInfo.userId,
        username: this.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_SERVER_CHANNEL,
        serverId: this.serverInfo.id,
        channelId: this.currentChannel.id
      } as MessageToServerChannel,
      messageType: MESSAGE_TYPE_TEXT,
      message: strToUtf8Bytes(this.inputMsgControl.nativeElement.value)
    } as BiaMessage);
    this.inputMsgControl.nativeElement.value = '';
  }
}
