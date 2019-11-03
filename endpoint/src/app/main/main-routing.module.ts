import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from './main/main.component';
import {MainDetailComponent} from './main-detail/main-detail.component';
import {SettingComponent} from './setting/setting.component';
import {UserMessagesComponent} from './user-messages/user-messages.component';

const routes: Routes = [
  {
    path: '', component: MainComponent,
    children: [
      {
        path: '', redirectTo: 'main', pathMatch: 'full'
      },
      {
        path: 'main', component: MainDetailComponent, children: [
          {
            path: '', redirectTo: 'setting', pathMatch: 'full'
          },
          {path: 'setting', component: SettingComponent},
          {path: 'user-message/:userId', component: UserMessagesComponent}
        ]
      },
      {
        path: 'server', loadChildren: () => import('../server/server.module').then(m => m.ServerModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule {
}
