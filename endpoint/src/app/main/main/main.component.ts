import {Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {byteArray2Str} from '../bia-message-websocket-subject';
import {WsConnectionService} from '../ws-connection.service';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_SERVER_CHANNEL,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVERS,
  MESSAGE_TYPE_ON_PASS_RTC_CONN,
  MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST,
  MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE,
  MESSAGE_TYPE_PLAYER_JOIN_CHANNEL,
  MESSAGE_TYPE_PLAYER_LEFT_CHANNEL,
  MESSAGE_TYPE_REPLY_SERVER_CHANNELS,
  MESSAGE_TYPE_REPLY_SERVER_USER_GROUP,
  MESSAGE_TYPE_REPLY_SERVERS,
  MESSAGE_TYPE_SERVER_INVITE,
  MESSAGE_TYPE_TEXT,
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
import {RtcConnectionService} from '../rtc-connection.service';
import {ChannelConnectionService} from '../../server/channel-connection.service';

enum ResizeDirection {
  top = 1,
  left = 2,
  bottom = 3,
  right = 4,
  top_left = 5,
  top_right = 6,
  bottom_left = 7,
  bottom_right = 8
}

class ResizeStats {
  direction: ResizeDirection;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit, OnDestroy {
  @ViewChild('screenShare', {static: true}) screenShare: ElementRef<HTMLDivElement>;
  private ngUnSubscribe = new Subject();
  servers: ChatServer[];
  authInfo: AuthInfo;
  bsModalRef: BsModalRef;
  private keepAliveIntervalObv: Observable<number>;
  private keepAliveInterval = 10000;
  ready = false;
  maxScreenShare = false;
  minScreenShare = false;
  private beforeMaxScreenShareSize: { width: string, height: string, right: string, bottom: string };
  private beforeMinScreenShareSize: { width: string, height: string, right: string, bottom: string };

  resizeDirections = ResizeDirection;
  private resizeState: ResizeStats;
  private dragging = false;
  private draggingMouseLastPos: { x: number, y: number };

  private keyCodeTalk = 'KeyC';
  isTalking = false;

  constructor(private wsConnService: WsConnectionService,
              private modalService: BsModalService,
              private http: HttpClient,
              private serverInfoService: ServerInfoService,
              private electron: ElectronService,
              private rtcConnectionService: RtcConnectionService,
              private channelConnSvr: ChannelConnectionService,
              private router: Router,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    window.addEventListener('keydown', this.readyToTalk.bind(this), true);
    window.addEventListener('keyup', this.releaseTalk.bind(this), true);
    this.rtcConnectionService.setScreenShareElement(this.screenShare);
    this.authInfo = this.authService.authInfo;

    this.keepAliveIntervalObv = interval(this.keepAliveInterval);
    this.keepAliveIntervalObv
      .pipe(takeUntil(this.ngUnSubscribe))
      .subscribe(_ => {
        this.doKeepAlive();
      });
    this.wsConnService.onReady()
      .pipe(takeUntil(this.ngUnSubscribe))
      .subscribe(value => {
        this.ready = value;
      });
    this.authService.getAuthorizationToken().subscribe(token => {
      this.wsConnService.connectGlobalSubject(token).subscribe(value => {
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
    this.wsConnService.closeAll();
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
    this.wsConnService.getGlobalSocketSubject().send({
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
      case MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST:
      case MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE: {
        this.parseScreenShareMessage(value);
        break;
      }
      case MESSAGE_TYPE_ON_PASS_RTC_CONN: {
        this.rtcConnectionService.parseScreenShareRTCMessage(value);
        break;
      }
      default: {
        console.log(value);
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

  parseScreenShareMessage(value: BiaMessage) {
    switch (value.messageType) {
      case MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST: {
        this.wsConnService.addFromUserMessage(value, (value.messageFrom as MessageFromUser).userId);
        break;
      }
      case MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE: {
        this.wsConnService.addFromUserMessage(value, (value.messageFrom as MessageFromUser).userId);

        const request = this.wsConnService.requestForScreenShare;
        if (request && request.requiring && request.userId === (value.messageFrom as MessageFromUser).userId) {
          const data = parseInt(byteArray2Str(value.message), 10);
          if (data === 0) {
            clearTimeout(request.timeoutHandle);
            this.rtcConnectionService.setLocalStream().then(() => {
              this.rtcConnectionService.createPeerConnection(true).then(() => {
              });
            });
          } else {
            request.requiring = false;
            clearTimeout(request.timeoutHandle);
          }
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  maximizeScreenShare() {
    if (!this.maxScreenShare) {
      this.beforeMaxScreenShareSize = this.storeCurrentScreenShareStats();
      const screenShareEle = this.screenShare.nativeElement;
      screenShareEle.style.height = window.innerHeight + 'px';
      screenShareEle.style.width = window.innerWidth + 'px';
      screenShareEle.style.right = '0px';
      screenShareEle.style.bottom = '0px';
      screenShareEle.style.transform = null;
      this.maxScreenShare = true;
    } else {
      this.restoreScreenShareStats(this.beforeMaxScreenShareSize);
      this.beforeMaxScreenShareSize = null;
      this.maxScreenShare = false;
    }
  }

  private storeCurrentScreenShareStats() {
    const screenShareEle = this.screenShare.nativeElement;
    return {
      width: screenShareEle.style.width,
      height: screenShareEle.style.height,
      right: screenShareEle.style.right,
      bottom: screenShareEle.style.bottom
    };
  }

  private restoreScreenShareStats(restoreFrom) {
    const screenShareEle = this.screenShare.nativeElement;
    screenShareEle.style.height = restoreFrom.height;
    screenShareEle.style.width = restoreFrom.width;
    screenShareEle.style.right = restoreFrom.right;
    screenShareEle.style.bottom = restoreFrom.bottom;
  }

  minimizeScreenShare() {
    if (!this.minScreenShare) {
      this.beforeMinScreenShareSize = this.storeCurrentScreenShareStats();
      const screenShareEle = this.screenShare.nativeElement;
      screenShareEle.style.height = 23 + 'px';
      screenShareEle.style.width = 70 + 'px';
      screenShareEle.style.transform = null;
      this.minScreenShare = true;
    } else {
      this.restoreScreenShareStats(this.beforeMinScreenShareSize);
      this.beforeMinScreenShareSize = null;
      this.minScreenShare = false;
    }
  }

  closeScreenShare() {
    this.maxScreenShare = false;
    this.rtcConnectionService.closeConnection();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.maxScreenShare) {
      const screenShareEle = this.screenShare.nativeElement;
      screenShareEle.style.height = window.innerHeight + 'px';
      screenShareEle.style.width = window.innerWidth + 'px';
    }
  }

  startResizing($event: MouseEvent, direction: ResizeDirection) {
    if (this.minScreenShare || this.maxScreenShare) {
      return;
    }
    this.resizeState = {direction};
    this.draggingMouseLastPos = {
      x: $event.clientX,
      y: $event.clientY
    };
  }

  @HostListener('mouseleave', ['$event'])
  onMouseleave($event: MouseEvent) {
    this.resizeState = null;
    this.dragging = false;
  }

  @HostListener('mouseup', ['$event'])
  onMouseup($event: MouseEvent) {
    this.resizeState = null;
    this.dragging = false;
  }

  @HostListener('mousemove', ['$event'])
  onMousemove($event: MouseEvent) {
    if (this.resizeState) {
      const screenShareEle = this.screenShare.nativeElement;
      const height = screenShareEle.offsetHeight;
      const movedY = $event.clientY - this.draggingMouseLastPos.y;
      const movedX = $event.clientX - this.draggingMouseLastPos.x;
      const width = screenShareEle.offsetWidth;

      switch (this.resizeState.direction) {
        case ResizeDirection.bottom: {
          screenShareEle.style.height = height + movedY + 'px';
          const originalBottom = this.parsePxValue(screenShareEle.style.bottom);
          screenShareEle.style.bottom = originalBottom - movedY + 'px';
          break;
        }
        case ResizeDirection.top: {
          screenShareEle.style.height = height - movedY + 'px';
          break;
        }
        case ResizeDirection.left: {
          screenShareEle.style.width = width - movedX + 'px';
          break;
        }
        case ResizeDirection.right: {
          screenShareEle.style.width = width + movedX + 'px';
          const originalRight = this.parsePxValue(screenShareEle.style.right);
          screenShareEle.style.right = originalRight - movedX + 'px';
          break;
        }
        case ResizeDirection.top_left: {
          screenShareEle.style.height = height - movedY + 'px';
          screenShareEle.style.width = width - movedX + 'px';
          break;
        }
        case ResizeDirection.top_right: {
          screenShareEle.style.height = height - movedY + 'px';
          screenShareEle.style.width = width + movedX + 'px';
          const originalRight = this.parsePxValue(screenShareEle.style.right);
          screenShareEle.style.right = originalRight - movedX + 'px';
          break;
        }
        case ResizeDirection.bottom_left: {
          screenShareEle.style.width = width - movedX + 'px';
          screenShareEle.style.height = height + movedY + 'px';
          const originalBottom = this.parsePxValue(screenShareEle.style.bottom);
          screenShareEle.style.bottom = originalBottom - movedY + 'px';
          break;
        }
        case ResizeDirection.bottom_right: {
          const originalBottom = this.parsePxValue(screenShareEle.style.bottom);
          const originalRight = this.parsePxValue(screenShareEle.style.right);
          screenShareEle.style.bottom = originalBottom - movedY + 'px';
          screenShareEle.style.right = originalRight - movedX + 'px';
          screenShareEle.style.height = height + movedY + 'px';
          screenShareEle.style.width = width + movedX + 'px';
          break;
        }
        default: {
          break;
        }
      }
      this.draggingMouseLastPos = {
        x: $event.clientX,
        y: $event.clientY
      };
    } else if (this.dragging) {
      const screenShareEle = this.screenShare.nativeElement;
      const movedX = $event.clientX - this.draggingMouseLastPos.x;
      const movedY = $event.clientY - this.draggingMouseLastPos.y;
      const originalRight = this.parsePxValue(screenShareEle.style.right);
      const originalBottom = this.parsePxValue(screenShareEle.style.bottom);
      screenShareEle.style.right = originalRight - movedX + 'px';
      screenShareEle.style.bottom = originalBottom - movedY + 'px';
      this.draggingMouseLastPos = {
        x: $event.clientX,
        y: $event.clientY
      };
    }
  }

  private parsePxValue(px: string): number {
    if (!px) {
      return 0;
    }
    const values = px.split('px');
    if (!values || values.length < 2) {
      return 0;
    }
    try {
      return parseInt(values[0], 10);
    } catch (e) {
      return 0;
    }
  }

  startDragging($event: MouseEvent) {
    if (this.minScreenShare || this.maxScreenShare) {
      return;
    }
    this.dragging = true;
    this.draggingMouseLastPos = {
      x: $event.clientX,
      y: $event.clientY
    };
  }

  readyToTalk($event: KeyboardEvent) {
    const code = $event.code;
    if (code === this.keyCodeTalk) {
      if (!this.isTalking) {
        this.isTalking = true;
        this.channelConnSvr.startSendAudio();
      }
    }
  }

  releaseTalk($event: KeyboardEvent) {
    const code = $event.code;
    if (code === this.keyCodeTalk) {
      if (this.isTalking) {
        this.isTalking = false;
        this.channelConnSvr.stopSendAudio();
      }
    }
  }
}
