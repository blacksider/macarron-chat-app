import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../auth/auth.service';
import {Router} from '@angular/router';
import {AuthInfo} from '../../auth/auth-info';
import {ConfirmService} from '../../shared/confirm/confirm.service';

@Component({
  selector: 'app-main-detail',
  templateUrl: './main-detail.component.html',
  styleUrls: ['./main-detail.component.less']
})
export class MainDetailComponent implements OnInit {
  authInfo: AuthInfo;

  constructor(private authService: AuthService,
              private confirm: ConfirmService,
              private router: Router) {
  }

  ngOnInit() {
    this.authInfo = this.authService.authInfo;
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
}
