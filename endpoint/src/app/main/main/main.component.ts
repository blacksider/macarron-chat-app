import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {BiaMessageWebsocketSubject, byteArray2Str} from '../bia-message-websocket-subject';
import {WsConnectionService} from '../ws-connection.service';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVERS,
  MESSAGE_TYPE_REPLY_SERVER_CHANNELS,
  MESSAGE_TYPE_REPLY_SERVERS,
  MessageFromUser,
  MessageToUser
} from '../bia-message';
import {ChatServer} from '../../server/chat-server';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {AddServerComponent} from '../add-server/add-server.component';
import {ServerInfoService} from '../../server/server-info.service';
import {ServerChannelWrap} from '../../server/chat-server-channel';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit, OnDestroy {
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  servers: ChatServer[];
  authInfo: AuthInfo;
  bsModalRef: BsModalRef;

  constructor(private wsConnService: WsConnectionService,
              private modalService: BsModalService,
              private serverInfoService: ServerInfoService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authInfo = this.authService.authInfo;
    this.authService.getAuthorizationToken().subscribe(token => {
      this.globalSocketSubject = this.wsConnService.connectGlobalSubject(token);
      this.globalSocketSubject.subscribe(value => {
        switch (value.messageType) {
          case MESSAGE_TYPE_REPLY_SERVERS: {
            this.parseServers(value.message);
            break;
          }
          case MESSAGE_TYPE_REPLY_SERVER_CHANNELS: {
            this.parseServerChannels(value.message);
            break;
          }
          default: {
            break;
          }
        }
      });
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
        messageType: MESSAGE_TYPE_GET_SERVERS,
        message: []
      } as BiaMessage);
    });
    this.serverInfoService.getServers().subscribe(value => {
      this.servers = value;
    });
  }

  ngOnDestroy(): void {
    this.globalSocketSubject.complete();
    if (this.bsModalRef) {
      this.bsModalRef.hide();
    }
  }

  private parseServers(message: number[]) {
    const servers = JSON.parse(byteArray2Str(message)) as ChatServer[];
    console.log(byteArray2Str(message));
    this.serverInfoService.setServers(servers);
  }

  addServer() {
    this.bsModalRef = this.modalService.show(AddServerComponent, {class: 'modal-dialog-centered'});
  }

  private parseServerChannels(message: number[]) {
    const channelData = JSON.parse(byteArray2Str(message)) as ServerChannelWrap;
    this.serverInfoService.appendChannels(channelData.serverId, channelData.channels);
  }
}
