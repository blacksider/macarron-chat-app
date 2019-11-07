import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST,
  MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE,
  MESSAGE_TYPE_SERVER_INVITE,
  MESSAGE_TYPE_START_CHAT,
  MESSAGE_TYPE_TEXT,
  MessageFromUser,
  MessageToUser
} from '../bia-message';
import {WsConnectionService} from '../ws-connection.service';
import {byteArray2Str, str2ByteArray, strToUtf8Bytes} from '../bia-message-websocket-subject';
import {InviteToServerWrap} from '../invite-to-server-wrap';
import {ServerInfoService} from '../../server/server-info.service';
import {ResolveServerInvite} from '../resolve-server-invite';
import {ToastrService} from 'ngx-toastr';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';
import {RtcConnectionService} from '../rtc-connection.service';

const KEYCODE_ENTER = 'Enter';
const KEYCODE_Shift = 'ShiftLeft';

class KeyDownData {
  code: string;
  time: Date;
}

@Component({
  selector: 'app-user-messages',
  templateUrl: './user-messages.component.html',
  styleUrls: ['./user-messages.component.less']
})
export class UserMessagesComponent implements OnInit {
  @ViewChild('inputMsg', {static: true}) inputMsgControl: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageContainer', {static: true}) messageContainer: ElementRef<any>;
  fromUserMessage: BiaMessage[];
  fromUserMessageSub: any;
  messageTypes = {
    inviteToServer: MESSAGE_TYPE_SERVER_INVITE,
    requestScreenShare: MESSAGE_TYPE_ON_SCREEN_SHARE_REQUEST,
    responseScreenShare: MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE,
    text: MESSAGE_TYPE_TEXT
  };
  lastPressedKey: KeyDownData;
  delta = 500;
  unSubscribe: Subject<any>;
  authInfo: AuthInfo;
  messageFrom: MessageFromUser;

  constructor(private route: ActivatedRoute,
              private svrService: ServerInfoService,
              private toastr: ToastrService,
              private authService: AuthService,
              private rtcConnectionService: RtcConnectionService,
              private router: Router,
              private wsConnService: WsConnectionService) {
  }

  ngOnInit() {
    this.authInfo = this.authService.authInfo;
    this.route.paramMap.subscribe(value => {
      if (this.unSubscribe) {
        this.unSubscribe.next();
        this.unSubscribe.complete();
        this.unSubscribe = null;
      }
      this.unSubscribe = new Subject();
      const userId = parseInt(value.get('userId'), 10);
      if (this.fromUserMessageSub) {
        this.fromUserMessageSub.unsubscribe();
      }
      this.fromUserMessage = [];
      this.wsConnService.getFromUserMessageUsers()
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(users => {
          if (users.findIndex(u => u.userId === userId) === -1) {
            this.router.navigate(['/app/main/setting']);
          }
        });
      this.fromUserMessageSub = this.wsConnService.getFromUserMessage(userId)
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(messages => {
          this.messageFrom = messages[0].messageFrom as MessageFromUser;
          this.fromUserMessage = messages.filter(m => m.messageType !== MESSAGE_TYPE_START_CHAT);
          setTimeout(() => {
            const elem = this.messageContainer.nativeElement;
            elem.scrollTop = elem.scrollHeight - elem.clientHeight;
          });
        });
    });
  }

  getInviteToServerData(message: BiaMessage) {
    const data = JSON.parse(byteArray2Str(message.message)) as InviteToServerWrap;
    return data.toServer.serverName;
  }

  resolveInvite(accept: boolean, message: BiaMessage) {
    const data = JSON.parse(byteArray2Str(message.message)) as InviteToServerWrap;
    const req = new ResolveServerInvite();
    req.inviteId = data.inviteId;
    req.accept = accept;
    this.svrService.resolveServerInvite(req).subscribe(_ => {
      this.toastr.success('处理成功');
    });
  }

  keyDown($event: KeyboardEvent) {
    if (!this.lastPressedKey) {
      this.lastPressedKey = {
        code: $event.code,
        time: new Date()
      };
      return;
    }
    const code = $event.code;
    const now = new Date();

    if (code === KEYCODE_ENTER) {
      if (this.lastPressedKey.code === KEYCODE_Shift) {
        if (now.getTime() - this.lastPressedKey.time.getTime() <= this.delta) {
          $event.preventDefault();
          this.sendMessage();
        }
      }
    }

    this.lastPressedKey = {
      code: code,
      time: now
    };
  }

  sendMessage() {
    const message = this.inputMsgControl.nativeElement.value;
    if (!message) {
      return;
    }

    const tempMessageFrom = new MessageFromUser();
    tempMessageFrom.userId = this.messageFrom.userId;
    tempMessageFrom.username = this.messageFrom.username;
    this.wsConnService.addFromUserStartChatMessage(tempMessageFrom);

    const messageData = {
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authInfo.userId,
        username: this.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_USER,
        userId: this.messageFrom.userId,
        username: this.messageFrom.username
      } as MessageToUser,
      messageType: MESSAGE_TYPE_TEXT,
      message: strToUtf8Bytes(this.inputMsgControl.nativeElement.value)
    } as BiaMessage;
    this.wsConnService.getGlobalSocketSubject().send(messageData);

    this.wsConnService.addFromUserMessage(Object.assign({}, messageData,
      {
        message: str2ByteArray(this.inputMsgControl.nativeElement.value)
      }), this.messageFrom.userId);
    this.inputMsgControl.nativeElement.value = '';
  }

  parseTextMessage(message: number[]) {
    return byteArray2Str(message);
  }

  resolveScreenShareInvite(accept: boolean) {
    const messageData = {
      messageFrom: {
        type: MESSAGE_FROM_USER,
        userId: this.authInfo.userId,
        username: this.authInfo.username
      } as MessageFromUser,
      time: new Date().getTime(),
      messageTo: {
        type: MESSAGE_TO_USER,
        userId: this.messageFrom.userId,
        username: this.messageFrom.username
      } as MessageToUser,
      messageType: MESSAGE_TYPE_ON_SCREEN_SHARE_RESPONSE,
      message: strToUtf8Bytes('' + (accept ? 0 : 1))
    } as BiaMessage;
    this.wsConnService.getGlobalSocketSubject().send(messageData);
    this.wsConnService.acceptResponseForScreenShare(this.messageFrom.userId, this.messageFrom.username, accept);
    if (accept) {
      this.rtcConnectionService.createPeerConnection(false).then(() => {
      });
    }
  }
}
