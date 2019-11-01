import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfirmComponent} from './confirm/confirm.component';
import {ConfirmService} from './confirm/confirm.service';
import {ModalModule} from 'ngx-bootstrap';
import {TitleBarComponent} from './title-bar/title-bar.component';

@NgModule({
  imports: [
    CommonModule,
    ModalModule.forRoot()
  ],
  exports: [TitleBarComponent],
  entryComponents: [ConfirmComponent],
  declarations: [ConfirmComponent, TitleBarComponent],
  providers: [ConfirmService]
})
export class SharedModule {
}
