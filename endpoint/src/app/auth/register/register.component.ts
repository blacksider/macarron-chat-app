import {Component, OnInit, ViewChild} from '@angular/core';
import {UserRegister} from '../user-register';
import {AuthService} from '../auth.service';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.less']
})
export class RegisterComponent implements OnInit {
  @ViewChild('regForm', {static: true}) regForm: NgForm;
  regData: UserRegister;

  constructor(private authService: AuthService,
              private router: Router,
              private toastr: ToastrService) {
  }

  ngOnInit() {
    this.regData = new UserRegister();
  }

  doRegister() {
    if (!this.regForm.form.valid) {
      Object.keys(this.regForm.form.controls).forEach(element => {
        this.regForm.form.get(element).markAsTouched({onlySelf: true});
      });
      return;
    }
    this.authService.register(this.regData).subscribe(_ => {
      this.toastr.success('注册成功');
      this.router.navigate(['/auth/login']);
    });
  }
}
