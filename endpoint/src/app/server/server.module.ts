import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServerInfoComponent} from './server-info/server-info.component';
import {ServerRoutingModule} from './server-routing.module';
import {ServerInfoService} from './server-info.service';
import {ServerInfoResolver} from './server-info/server-info-resolver.service';
import {ServerRoomService} from './server-room.service';

@NgModule({
  declarations: [ServerInfoComponent],
  imports: [
    CommonModule,
    ServerRoutingModule
  ],
  providers: [
    ServerInfoService,
    ServerInfoResolver,
    ServerRoomService
  ]
})
export class ServerModule {
}
