import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServerInfo, ServerRoomInfo} from './server-info';

@Injectable()
export class ServerInfoService {
  constructor(private http: HttpClient) {
  }

  getServerInfo(id: string): Observable<ServerInfo> {
    return this.http.get<ServerInfo>('/api/server/info/' + id);
  }

  listServerRooms(id: string): Observable<ServerRoomInfo[]> {
    return this.http.get<ServerRoomInfo[]>('/api/server/room?id=' + id);
  }
}
