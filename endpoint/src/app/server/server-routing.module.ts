import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ServerInfoComponent} from './server-info/server-info.component';
import {ServerInfoResolver} from './server-info/server-info-resolver.service';

const routes: Routes = [
  {
    path: ':id', component: ServerInfoComponent,
    resolve: {
      serverInfo: ServerInfoResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServerRoutingModule {
}
