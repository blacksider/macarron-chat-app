import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ChatServerUser} from '../chat-server-users';
import {WsConnectionService} from '../../main/ws-connection.service';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST,
  MessageFromUser,
  MessageToUser
} from '../../main/bia-message';
import {Router} from '@angular/router';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {takeUntil} from 'rxjs/operators';
import {BiaMessageWebsocketSubject} from '../../main/bia-message-websocket-subject';
import {Subject} from 'rxjs';

@Component({
  selector: 'app-click-user-menu',
  templateUrl: './click-user-menu.component.html',
  styleUrls: ['./click-user-menu.component.less']
})
export class ClickUserMenuComponent implements OnInit, OnDestroy {
  @Input() position: { x: number, y: number };
  @Input() user: ChatServerUser;
  authInfo: AuthInfo;
  private unSubscribe = new Subject();

  constructor(private wsConnService: WsConnectionService,
              private authService: AuthService,
              private router: Router) {
  }

  ngOnInit() {
    this.authInfo = this.authService.authInfo;
  }

  ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

  sendMessageTo() {
    const tempMessageFrom = new MessageFromUser();
    tempMessageFrom.userId = this.user.user.id;
    tempMessageFrom.username = this.user.user.username;

    this.wsConnService.addFromUserStartChatMessage(tempMessageFrom);
    this.router.navigate([`/app/main/user-message/${this.user.user.id}`]);
  }

  shareScreenTo() {
    const tempMessageFrom = new MessageFromUser();
    tempMessageFrom.userId = this.user.user.id;
    tempMessageFrom.username = this.user.user.username;

    this.wsConnService.addFromUserStartChatMessage(tempMessageFrom);

    const requestForScreenShare = {
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authInfo.userId,
        username: this.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_USER,
        userId: this.user.user.id,
        username: this.user.user.username
      } as MessageToUser,
      messageType: MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST,
      message: []
    } as BiaMessage;

    this.wsConnService.addFromUserMessage(requestForScreenShare, this.user.user.id);
    this.wsConnService.getGlobalSocketSubject().send(requestForScreenShare);
    this.wsConnService.setOnRequestForScreenShare(this.user.user.id, this.user.user.username);
    this.router.navigate([`/app/main/user-message/${this.user.user.id}`]);
  }
}
