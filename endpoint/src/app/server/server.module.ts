import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServerInfoComponent} from './server-info/server-info.component';
import {ServerRoutingModule} from './server-routing.module';
import {AddChannelComponent} from './add-channel/add-channel.component';
import {AddUserGroupComponent} from './add-user-group/add-user-group.component';
import {BsDropdownModule, PopoverModule} from 'ngx-bootstrap';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {InviteUserComponent} from './invite-user/invite-user.component';
import {ClickUserMenuComponent} from './click-user-menu/click-user-menu.component';

@NgModule({
  declarations: [ServerInfoComponent, AddChannelComponent, AddUserGroupComponent, InviteUserComponent, ClickUserMenuComponent],
  imports: [
    CommonModule,
    ServerRoutingModule,
    BsDropdownModule.forRoot(),
    FormsModule,
    SharedModule,
    PopoverModule.forRoot()
  ],
  providers: [
  ],
  entryComponents: [
    AddChannelComponent,
    AddUserGroupComponent,
    InviteUserComponent
  ]
})
export class ServerModule {
}
