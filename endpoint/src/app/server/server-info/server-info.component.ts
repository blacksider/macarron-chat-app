import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerInfoService} from '../server-info.service';
import {ActivatedRoute} from '@angular/router';
import {ChatServerChannel} from '../chat-server-channel';
import {ChatServer} from '../chat-server';
import {BiaMessageWebsocketSubject, str2ByteArray} from '../../main/bia-message-websocket-subject';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVER_CHANNELS,
  MessageFromUser,
  MessageToUser
} from '../../main/bia-message';
import {WsConnectionService} from '../../main/ws-connection.service';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';

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
  connected = true;
  authInfo: AuthInfo;

  constructor(private svrService: ServerInfoService,
              private connService: WsConnectionService,
              private route: ActivatedRoute,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.authInfo = this.authService.authInfo;
    const serverId = parseInt(this.route.snapshot.paramMap.get('id'), 10);
    this.svrService.getServer(serverId).subscribe(value => {
      this.serverInfo = value;
    });
    this.svrService.getChannels(serverId).subscribe(value => {
      this.channels = value;
    });
    this.connService.isReady().subscribe(ready => {
      if (ready) {
        this.globalSocketSubject = this.connService.getGlobalSocketSubject();
        this.globalSocketSubject.next({
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
          messageType: MESSAGE_TYPE_GET_SERVER_CHANNELS,
          message: str2ByteArray(serverId + '')
        } as BiaMessage);
      }
    });
  }

  ngOnDestroy(): void {
  }

  connectTo(room: ChatServerChannel) {
    this.currentChannel = room;
  }

  isInRoom(room: ChatServerChannel) {
    return this.currentChannel === room;
  }

  sendMessage() {

  }
}
