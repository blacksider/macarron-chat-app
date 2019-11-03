import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerInfoService} from '../server-info.service';
import {ActivatedRoute} from '@angular/router';
import {ChatServerChannel} from '../chat-server-channel';
import {ChatServer} from '../chat-server';
import {BiaMessageWebsocketSubject, byteArray2Str, strToUtf8Bytes} from '../../main/bia-message-websocket-subject';
import {
  BiaMessage,
  MESSAGE_FROM_USER,
  MESSAGE_TO_SERVER_CHANNEL,
  MESSAGE_TO_USER,
  MESSAGE_TYPE_GET_SERVER_CHANNELS,
  MESSAGE_TYPE_GET_SERVER_USER_GROUP,
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
import {ChatServerUserGroup, SERVER_USER_OWNER} from '../chat-server-users';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {AddChannelComponent} from '../add-channel/add-channel.component';
import {AddUserGroupComponent} from '../add-user-group/add-user-group.component';
import {ConfirmService} from '../../shared/confirm/confirm.service';
import {ToastrService} from 'ngx-toastr';
import {InviteUserComponent} from '../invite-user/invite-user.component';

const KEYCODE_ENTER = 'Enter';
const KEYCODE_Shift = 'ShiftLeft';

class KeyDownData {
  code: string;
  time: Date;
}

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
  userGroups: ChatServerUserGroup[];
  currentChannel: ChatServerChannel;
  connected = false;
  authInfo: AuthInfo;
  unSubscribe: Subject<any>;
  channelMessageSub: any;
  channelMessages: BiaMessage[];
  lastPressedKey: KeyDownData;
  delta = 500;
  addChannelModalRef: BsModalRef;
  addGroupModalRef: BsModalRef;
  inviteUserModalRef: BsModalRef;

  constructor(private svrService: ServerInfoService,
              private connService: WsConnectionService,
              private modalService: BsModalService,
              private route: ActivatedRoute,
              private confirm: ConfirmService,
              private toastr: ToastrService,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (this.unSubscribe) {
        this.unSubscribe.next();
        this.unSubscribe.complete();
        this.unSubscribe = null;
      }
      this.channels = null;
      this.userGroups = null;
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
      this.svrService.getUserGroups(serverId)
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(value => {
          this.userGroups = value;
        });
      this.connService.isReady()
        .pipe(
          takeUntil(this.unSubscribe)
        )
        .subscribe(ready => {
          if (ready) {
            this.globalSocketSubject = this.connService.getGlobalSocketSubject();
            const fromMe = {
              type: MESSAGE_FROM_USER,
              userId: this.authInfo.userId,
              username: this.authInfo.username
            } as MessageFromUser;

            const toMe = {
              type: MESSAGE_TO_USER,
              userId: this.authInfo.userId,
              username: this.authInfo.username
            } as MessageToUser;

            this.globalSocketSubject.send({
              messageFrom: fromMe,
              messageTo: toMe,
              time: new Date().getTime(),
              messageType: MESSAGE_TYPE_GET_SERVER_CHANNELS,
              message: strToUtf8Bytes(serverId + '')
            } as BiaMessage);

            this.globalSocketSubject.send({
              messageFrom: fromMe,
              messageTo: toMe,
              time: new Date().getTime(),
              messageType: MESSAGE_TYPE_GET_SERVER_USER_GROUP,
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
    if (this.addChannelModalRef) {
      this.addChannelModalRef.hide();
    }
    if (this.addGroupModalRef) {
      this.addGroupModalRef.hide();
    }
    if (this.inviteUserModalRef) {
      this.inviteUserModalRef.hide();
    }
  }

  parseTextMessage(message: number[]) {
    return byteArray2Str(message);
  }

  connectTo(channel: ChatServerChannel) {
    if (!!this.currentChannel && this.currentChannel.id === channel.id) {
      return;
    }
    this.channelMessages = null;
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
    return this.currentChannel.id === channel.id;
  }

  sendMessage() {
    const message = this.inputMsgControl.nativeElement.value;
    if (!message) {
      return;
    }
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

  addChannel() {
    if (!this.serverInfo) {
      return;
    }
    const initialState = {
      serverId: this.serverInfo.id
    };
    this.addChannelModalRef = this.modalService.show(AddChannelComponent, {class: 'modal-dialog-centered', initialState});
  }

  addUserGroup() {
    if (!this.serverInfo) {
      return;
    }
    const initialState = {
      serverId: this.serverInfo.id
    };
    this.addGroupModalRef = this.modalService.show(AddUserGroupComponent, {class: 'modal-dialog-centered', initialState});
  }

  deleteChannel(id: number) {
    this.confirm.confirm({
      title: '警告',
      message: '确定删除该频道？'
    }).subscribe(ok => {
      if (ok) {
        this.svrService.deleteChannel(id).subscribe(_ => {
          this.toastr.success('删除成功');
        });
      }
    });
  }

  deleteUserGroup(id: number) {
    this.confirm.confirm({
      title: '警告',
      message: '确定删除该组？'
    }).subscribe(ok => {
      if (ok) {
        this.svrService.deleteUserGroup(id).subscribe(_ => {
          this.toastr.success('删除成功');
        });
      }
    });
  }

  isOwner() {
    if (!this.userGroups) {
      return false;
    }
    for (const group of this.userGroups) {
      for (const user of group.users) {
        if (user.user.id === this.authInfo.userId) {
          return user.userType === SERVER_USER_OWNER;
        }
      }
    }
    return false;
  }

  exitServer() {
    if (!this.serverInfo) {
      return;
    }
    this.confirm.confirm({
      title: '警告',
      message: '确定删除退出该服务器？'
    }).subscribe(ok => {
      if (ok) {
        this.svrService.exitServer(this.serverInfo.id).subscribe(_ => {
          this.toastr.success('退出成功');
        });
      }
    });
  }

  deleteServer() {
    if (!this.serverInfo) {
      return;
    }

    this.confirm.confirm({
      title: '警告',
      message: '确定删除删除该服务器？'
    }).subscribe(ok => {
      if (ok) {
        this.svrService.deleteServer(this.serverInfo.id).subscribe(_ => {
          this.toastr.success('删除成功');
        });
      }
    });
  }

  inviteUser() {
    if (!this.serverInfo) {
      return;
    }
    const initialState = {
      serverId: this.serverInfo.id
    };
    this.inviteUserModalRef = this.modalService.show(InviteUserComponent, {class: 'modal-dialog-centered', initialState});
  }
}
