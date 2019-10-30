import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {ServerInfoService} from '../server-info.service';
import {ServerInfo} from '../server-info';

@Injectable()
export class ServerInfoResolver implements Resolve<ServerInfo> {
  constructor(private service: ServerInfoService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ServerInfo> {
    return this.service.getServerInfo(route.paramMap.get('id'));
  }
}
