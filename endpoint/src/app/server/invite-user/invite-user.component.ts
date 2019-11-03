import {Component, OnInit, ViewChild} from '@angular/core';
import {NgForm, NgModel} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap';
import {ToastrService} from 'ngx-toastr';
import {InviteUser} from './invite-user';
import {ServerInfoService} from '../server-info.service';

@Component({
  selector: 'app-invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.less']
})
export class InviteUserComponent implements OnInit {
  @ViewChild('form', {static: true}) form: NgForm;
  serverId: number;
  req: InviteUser;

  constructor(public bsModalRef: BsModalRef,
              private toastr: ToastrService,
              private svrService: ServerInfoService) {
  }

  ngOnInit() {
    this.req = new InviteUser();
    this.req.serverId = this.serverId;
  }

  close() {
    this.bsModalRef.hide();
  }

  confirm() {
    if (!this.form.form.valid) {
      Object.keys(this.form.form.controls).forEach(value => {
        this.form.form.get(value).markAsTouched({onlySelf: true});
      });
      return;
    }
    this.svrService.inviteUser(this.req).subscribe(_ => {
      this.toastr.success('邀请已发送').onShown.subscribe(() => {
        this.close();
      });
    });
  }

  getErrorMsg(name: NgModel) {
    if (name.invalid && (name.dirty || name.touched)) {
      if (name.errors.required) {
        return '请输入用户';
      } else {
        return '请输入正确的格式';
      }
    }
  }
}
