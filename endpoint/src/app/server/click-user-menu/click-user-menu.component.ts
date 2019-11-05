import {Component, Input, OnInit} from '@angular/core';
import {ChatServerUser} from '../chat-server-users';
import {WsConnectionService} from '../../main/ws-connection.service';
import {MessageFromUser} from '../../main/bia-message';
import {Router} from '@angular/router';

@Component({
  selector: 'app-click-user-menu',
  templateUrl: './click-user-menu.component.html',
  styleUrls: ['./click-user-menu.component.less']
})
export class ClickUserMenuComponent implements OnInit {
  @Input() position: { x: number, y: number };
  @Input() user: ChatServerUser;

  constructor(private wsConnService: WsConnectionService,
              private router: Router) {
  }

  ngOnInit() {
  }

  sendMessageTo() {
    const tempMessageFrom = new MessageFromUser();
    tempMessageFrom.userId = this.user.user.id;
    tempMessageFrom.username = this.user.user.username;

    this.wsConnService.addFromUserStartChatMessage(tempMessageFrom);
    this.router.navigate([`/app/main/user-message/${this.user.user.id}`]);
  }

  shareScreenTo() {

  }
}
