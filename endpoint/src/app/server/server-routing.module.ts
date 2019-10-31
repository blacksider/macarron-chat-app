import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ServerInfoComponent} from './server-info/server-info.component';

const routes: Routes = [
  {
    path: ':id', component: ServerInfoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerRoutingModule {
}
