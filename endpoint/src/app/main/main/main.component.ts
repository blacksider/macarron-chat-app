import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {BiaMessageWebsocketSubject, byteArray2Str} from '../bia-message-websocket-subject';
import {WsConnectionService} from '../ws-connection.service';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_SERVER_CHANNEL,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVERS,
  MESSAGE_TYPE_PLAYER_JOIN_CHANNEL,
  MESSAGE_TYPE_PLAYER_LEFT_CHANNEL,
  MESSAGE_TYPE_REPLY_SERVER_CHANNELS,
  MESSAGE_TYPE_REPLY_SERVER_USER_GROUP,
  MESSAGE_TYPE_REPLY_SERVERS,
  MESSAGE_TYPE_SERVER_INVITE,
  MESSAGE_TYPE_TEXT, MessageFrom,
  MessageFromUser,
  MessageToServerChannel,
  MessageToUser
} from '../bia-message';
import {ChatServer} from '../../server/chat-server';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {AddServerComponent} from '../add-server/add-server.component';
import {ServerInfoService} from '../../server/server-info.service';
import {ServerChannelWrap} from '../../server/chat-server-channel';
import {ServerUserGroupWrap} from '../../server/chat-server-users';
import {ElectronService} from 'ngx-electron';
import {Router} from '@angular/router';
import {interval, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit, OnDestroy {
  private ngUnSubscribe = new Subject();
  private globalSocketSubject: BiaMessageWebsocketSubject<BiaMessage>;
  servers: ChatServer[];
  authInfo: AuthInfo;
  bsModalRef: BsModalRef;
  private keepAliveIntervalObv: Observable<number>;
  private keepAliveInterval = 10000;

  constructor(private wsConnService: WsConnectionService,
              private modalService: BsModalService,
              private http: HttpClient,
              private serverInfoService: ServerInfoService,
              private electron: ElectronService,
              private router: Router,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authInfo = this.authService.authInfo;

    this.keepAliveIntervalObv = interval(this.keepAliveInterval);
    this.keepAliveIntervalObv
      .pipe(takeUntil(this.ngUnSubscribe))
      .subscribe(_ => {
        this.doKeepAlive();
      });
    this.authService.getAuthorizationToken().subscribe(token => {
      this.globalSocketSubject = this.wsConnService.connectGlobalSubject(token);
      this.globalSocketSubject.subscribe(value => {
        this.handleMessage(value);
      });
      this.requireServers();
    });
    this.serverInfoService.getServers().subscribe(value => {
      if (!value || value.length === 0) {
        this.router.navigate(['/app/main/setting']);
      }
      this.servers = value;
    });
  }

  ngOnDestroy(): void {
    this.globalSocketSubject.complete();
    if (this.bsModalRef) {
      this.bsModalRef.hide();
    }
    this.ngUnSubscribe.next();
    this.ngUnSubscribe.complete();
  }

  doKeepAlive() {
    this.http.get(`${environment.apiUrl}/api/user/check?time=${new Date().getTime()}`, {responseType: 'text'})
      .subscribe(_ => {
      });
  }

  private requireServers() {
    this.globalSocketSubject.send({
      time: new Date().getTime(),
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
  }

  private handleMessage(value: BiaMessage) {
    switch (value.messageType) {
      case MESSAGE_TYPE_REPLY_SERVERS: {
        this.parseServers(value.message);
        break;
      }
      case MESSAGE_TYPE_REPLY_SERVER_CHANNELS: {
        this.parseServerChannels(value.message);
        break;
      }
      case MESSAGE_TYPE_REPLY_SERVER_USER_GROUP: {
        this.parseServerUserGroups(value.message);
        break;
      }
      case MESSAGE_TYPE_TEXT: {
        this.parseTextMessage(value);
        break;
      }
      case MESSAGE_TYPE_SERVER_INVITE: {
        this.parseInviteToServerMessage(value);
        break;
      }
      case MESSAGE_TYPE_PLAYER_JOIN_CHANNEL:
      case MESSAGE_TYPE_PLAYER_LEFT_CHANNEL: {
        this.parsePlayerToChannelMessage(value);
        break;
      }
      default: {
        break;
      }
    }
  }

  private parseServers(message: number[]) {
    const servers = JSON.parse(byteArray2Str(message)) as ChatServer[];
    this.serverInfoService.setServers(servers);
  }

  addServer() {
    this.bsModalRef = this.modalService.show(AddServerComponent, {class: 'modal-dialog-centered'});
  }

  private parseServerChannels(message: number[]) {
    const channelData = JSON.parse(byteArray2Str(message)) as ServerChannelWrap;
    this.serverInfoService.appendChannels(channelData.serverId, channelData.channels);
    if (!!channelData.channelUsers) {
      this.wsConnService.initUserInChannel(channelData.channelUsers);
    }
  }

  private parseTextMessage(value: BiaMessage) {
    if (value.messageTo.type === MESSAGE_TO_SERVER_CHANNEL) {
      this.wsConnService.addChannelMessage(value);
    } else if (value.messageTo.type === MESSAGE_TO_USER) {
      this.wsConnService.addFromUserMessage(value, (value.messageFrom as MessageFromUser).userId);
    }
  }

  private parseServerUserGroups(message: number[]) {
    const groupData = JSON.parse(byteArray2Str(message)) as ServerUserGroupWrap;
    this.serverInfoService.appendUserGroups(groupData.serverId, groupData.userGroups);
  }

  private parseInviteToServerMessage(value: BiaMessage) {
    this.wsConnService.addFromUserMessage(value, (value.messageFrom as MessageFromUser).userId);
  }

  private parsePlayerToChannelMessage(value: BiaMessage) {
    switch (value.messageType) {
      case MESSAGE_TYPE_PLAYER_JOIN_CHANNEL: {
        this.wsConnService.addUserToChannel(value);
        break;
      }
      case MESSAGE_TYPE_PLAYER_LEFT_CHANNEL: {
        this.wsConnService.removeUserInChannel(
          (value.messageTo as MessageToServerChannel).channelId,
          (value.messageFrom as MessageFromUser).userId);
        break;
      }
      default: {
        break;
      }
    }
  }
}
