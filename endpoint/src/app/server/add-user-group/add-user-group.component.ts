import {Component, OnInit, ViewChild} from '@angular/core';
import {CreateUserGroupReq} from './create-user-group-req';
import {NgForm} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap';
import {ToastrService} from 'ngx-toastr';
import {ServerInfoService} from '../server-info.service';

@Component({
  selector: 'app-add-user-group',
  templateUrl: './add-user-group.component.html',
  styleUrls: ['./add-user-group.component.less']
})
export class AddUserGroupComponent implements OnInit {
  @ViewChild('form', {static: true}) form: NgForm;
  serverId: number;
  req: CreateUserGroupReq;

  constructor(public bsModalRef: BsModalRef,
              private toastr: ToastrService,
              private svrService: ServerInfoService) {
  }

  ngOnInit() {
    this.req = new CreateUserGroupReq();
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
    this.svrService.addUserGroup(this.req).subscribe(_ => {
      this.toastr.success('创建成功').onShown.subscribe(() => {
        this.close();
      });
    });
  }
}
