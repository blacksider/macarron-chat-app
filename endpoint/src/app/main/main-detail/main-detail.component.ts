import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthInfo} from '../../auth/auth-info';
import {ConfirmService} from '../../shared/confirm/confirm.service';
import {MessageFromUser} from '../bia-message';
import {WsConnectionService} from '../ws-connection.service';

@Component({
  selector: 'app-main-detail',
  templateUrl: './main-detail.component.html',
  styleUrls: ['./main-detail.component.less']
})
export class MainDetailComponent implements OnInit, OnDestroy {
  authInfo: AuthInfo;
  fromUsers: MessageFromUser[];
  fromUsersSub: any;

  constructor(private authService: AuthService,
              private confirm: ConfirmService,
              private wsConnService: WsConnectionService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.authInfo = this.authService.authInfo;
    this.fromUsersSub = this.wsConnService.getFromUserMessageUsers()
      .subscribe(value => {
        this.fromUsers = value;
      });
  }

  ngOnDestroy(): void {
    if (this.fromUsersSub) {
      this.fromUsersSub.unsubscribe();
    }
  }

  doLogout() {
    this.confirm.confirm({
      title: '警告',
      message: '确定退出？'
    }).subscribe(ok => {
      if (ok) {
        this.authService.logout().subscribe(res => {
          if (res) {
            this.router.navigate(['/auth/login']);
          }
        });
      }
    });
  }

  removeMessageOfUser($event: MouseEvent, user: MessageFromUser) {
    $event.preventDefault();
    this.wsConnService.removeFromUserMessage(user.userId);
    if (this.router.isActive(`/app/main/user-message/${user.userId}`, true)) {
      this.router.navigate(['/app/main/setting']);
    }
  }
}
