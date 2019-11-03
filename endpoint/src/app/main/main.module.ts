import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainComponent} from './main/main.component';
import {MainRoutingModule} from './main-routing.module';
import {FormsModule} from '@angular/forms';
import {MainDetailComponent} from './main-detail/main-detail.component';
import {SettingComponent} from './setting/setting.component';
import {SharedModule} from '../shared/shared.module';
import {AddServerComponent} from './add-server/add-server.component';
import {PopoverModule} from 'ngx-bootstrap';
import {UserMessagesComponent} from './user-messages/user-messages.component';

@NgModule({
  declarations: [
    MainComponent,
    MainDetailComponent,
    SettingComponent,
    AddServerComponent,
    UserMessagesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MainRoutingModule,
    SharedModule,
    PopoverModule.forRoot()
  ],
  entryComponents: [
    AddServerComponent
  ],
  providers: []
})
export class MainModule {
}
