import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BiaMessage, MESSAGE_TYPE_SERVER_INVITE} from '../bia-message';
import {WsConnectionService} from '../ws-connection.service';
import {byteArray2Str} from '../bia-message-websocket-subject';
import {InviteToServerWrap} from '../invite-to-server-wrap';
import {ServerInfoService} from '../../server/server-info.service';
import {ResolveServerInvite} from '../resolve-server-invite';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-user-messages',
  templateUrl: './user-messages.component.html',
  styleUrls: ['./user-messages.component.less']
})
export class UserMessagesComponent implements OnInit {
  fromUserMessage: BiaMessage[];
  fromUserMessageSub: any;
  messageTypes = {
    inviteToServer: MESSAGE_TYPE_SERVER_INVITE
  };

  constructor(private route: ActivatedRoute,
              private svrService: ServerInfoService,
              private toastr: ToastrService,
              private wsConnService: WsConnectionService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(value => {
      const userId = parseInt(value.get('userId'), 10);
      if (this.fromUserMessageSub) {
        this.fromUserMessageSub.unsubscribe();
      }
      this.fromUserMessage = [];
      this.fromUserMessageSub = this.wsConnService.getFromUserMessage(userId).subscribe(messages => {
        this.fromUserMessage = messages;
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
}
