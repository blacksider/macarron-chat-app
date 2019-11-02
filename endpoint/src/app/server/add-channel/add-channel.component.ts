import {Component, OnInit, ViewChild} from '@angular/core';
import {CreateChannelReq} from './create-channel-req';
import {NgForm} from '@angular/forms';
import {BsModalRef} from 'ngx-bootstrap';
import {ToastrService} from 'ngx-toastr';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-add-channel',
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.less']
})
export class AddChannelComponent implements OnInit {
  @ViewChild('form', {static: true}) form: NgForm;
  serverId: number;
  req: CreateChannelReq;

  constructor(public bsModalRef: BsModalRef,
              private toastr: ToastrService,
              private http: HttpClient) {
  }

  ngOnInit() {
    this.req = new CreateChannelReq();
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
    this.http.post<any>(`${environment.apiUrl}/api/server/channel`, this.req).subscribe(_ => {
      this.toastr.success('创建成功').onShown.subscribe(() => {
        this.close();
      });
    });
  }

}
