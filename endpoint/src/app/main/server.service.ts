import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServerInfo} from '../server/server-info';

@Injectable()
export class ServerService {
  constructor(private http: HttpClient) {
  }

  listServers(): Observable<ServerInfo[]> {
    return this.http.get<ServerInfo[]>('/api/server/list');
  }
}
