import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {AuthReq} from '../auth-req';
import {NgForm} from '@angular/forms';
import {AuthService} from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
  authReq: AuthReq = new AuthReq();
  @ViewChild('loginForm', {static: true}) loginForm: NgForm;

  constructor(private router: Router,
              private authService: AuthService) {
  }

  ngOnInit() {
  }

  doLogin(): void {
    if (!this.loginForm.form.valid) {
      Object.keys(this.loginForm.form.controls).forEach(element => {
        this.loginForm.form.get(element).markAsTouched({onlySelf: true});
      });
      return;
    }
    this.authService.login(this.authReq)
      .subscribe(authInfo => {
        if (!!authInfo) {
          if (!!this.authService.redirectUrl) {
            this.router.navigateByUrl(this.authService.redirectUrl)
              .catch(_ => {
                this.router.navigate(['/app']);
              });
          } else {
            this.router.navigate(['/app']);
          }
        }
      });
  }
}
