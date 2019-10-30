import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfirmComponent} from './confirm/confirm.component';
import {ConfirmService} from './confirm/confirm.service';
import {ModalModule} from 'ngx-bootstrap';

@NgModule({
  imports: [
    CommonModule,
    ModalModule.forRoot()
  ],
  exports: [],
  entryComponents: [ConfirmComponent],
  declarations: [ConfirmComponent],
  providers: [ConfirmService]
})
export class SharedModule {
}
