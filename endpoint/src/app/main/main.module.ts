import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainComponent} from './main/main.component';
import {MainRoutingModule} from './main-routing.module';
import {FormsModule} from '@angular/forms';
import {MainDetailComponent} from './main-detail/main-detail.component';
import {ServerService} from './server.service';
import {SettingComponent} from './setting/setting.component';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  declarations: [
    MainComponent,
    MainDetailComponent,
    SettingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MainRoutingModule,
    SharedModule
  ],
  providers: [
    ServerService
  ]
})
export class MainModule {
}
