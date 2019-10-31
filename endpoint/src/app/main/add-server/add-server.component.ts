import {Component, OnInit, ViewChild} from '@angular/core';
import {AddServerReq} from './add-server-req';
import {BsModalRef} from 'ngx-bootstrap';
import {NgForm} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-add-server',
  templateUrl: './add-server.component.html',
  styleUrls: ['./add-server.component.less']
})
export class AddServerComponent implements OnInit {
  @ViewChild('form', {static: true}) form: NgForm;
  private server: AddServerReq;

  constructor(public bsModalRef: BsModalRef,
              private toastr: ToastrService,
              private http: HttpClient) {
  }

  ngOnInit() {
    this.server = new AddServerReq();
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
    this.http.post<any>('/api/server', this.server).subscribe(_ => {
      this.toastr.success('创建成功').onShown.subscribe(() => {
        this.close();
      });
    });
  }
}
