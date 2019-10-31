import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServerInfoComponent} from './server-info/server-info.component';
import {ServerRoutingModule} from './server-routing.module';

@NgModule({
  declarations: [ServerInfoComponent],
  imports: [
    CommonModule,
    ServerRoutingModule
  ],
  providers: []
})
export class ServerModule {
}
