import {EventEmitter, Injectable} from '@angular/core';
import {ChatServer} from './chat-server';
import {ChatServerChannel} from './chat-server-channel';
import {merge, Observable, of} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {ChatServerUserGroup} from './chat-server-users';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {CreateChannelReq} from './add-channel/create-channel-req';
import {CreateUserGroupReq} from './add-user-group/create-user-group-req';
import {InviteUser} from './invite-user/invite-user';
import {ResolveServerInvite} from '../main/resolve-server-invite';

@Injectable({
  providedIn: 'root'
})
export class ServerInfoService {
  private servers: ChatServer[];
  private serverChange = new EventEmitter<ChatServer[]>();
  private serverChannels: Map<number, ChatServerChannel[]>;
  private serverChannelsChange = new EventEmitter<Map<number, ChatServerChannel[]>>();
  private serverUserGroups: Map<number, ChatServerUserGroup[]>;
  private serverUserGroupsChange = new EventEmitter<Map<number, ChatServerUserGroup[]>>();

  constructor(private http: HttpClient) {
    this.servers = [];
    this.serverChannels = new Map<number, ChatServerChannel[]>();
    this.serverUserGroups = new Map<number, ChatServerUserGroup[]>();
  }

  setServers(servers: ChatServer[]) {
    this.servers = servers;
    this.serverChange.emit(this.servers);
  }

  getServers(): Observable<ChatServer[]> {
    return this.serverChange.pipe(
      filter(value => !!value)
    );
  }

  getServer(serverId: number): Observable<ChatServer> {
    const changeObv = this.serverChange.pipe(
      map(data => {
        const find = data.find(value => value.id === serverId);
        if (!!find) {
          return find;
        }
        return null;
      }),
      filter(data => !!data)
    );
    const findSvr = this.servers.find(value => value.id === serverId);
    if (!!findSvr) {
      return merge(of(findSvr), changeObv);
    }
    return changeObv;
  }

  appendChannels(serverId: number, channels: ChatServerChannel[]) {
    this.serverChannels.set(serverId, channels);
    this.serverChannelsChange.emit(this.serverChannels);
  }

  getChannels(serverId: number): Observable<ChatServerChannel[]> {
    const changeObv = this.serverChannelsChange.pipe(
      map(data => {
        if (data.has(serverId)) {
          return data.get(serverId);
        }
        return null;
      }),
      filter(data => !!data)
    );
    if (this.serverChannels.has(serverId)) {
      return merge(of(this.serverChannels.get(serverId)), changeObv);
    }
    return changeObv;
  }

  appendUserGroups(serverId: number, userGroups: ChatServerUserGroup[]) {
    this.serverUserGroups.set(serverId, userGroups);
    this.serverUserGroupsChange.emit(this.serverUserGroups);
  }

  getUserGroups(serverId: number): Observable<ChatServerUserGroup[]> {
    const changeObv = this.serverUserGroupsChange.pipe(
      map(data => {
        if (data.has(serverId)) {
          return data.get(serverId);
        }
        return null;
      }),
      filter(data => !!data)
    );
    if (this.serverUserGroups.has(serverId)) {
      return merge(of(this.serverUserGroups.get(serverId)), changeObv);
    }
    return changeObv;
  }

  deleteChannel(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/server/channel?id=${id}`);
  }

  deleteUserGroup(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/server/user-group?id=${id}`);
  }

  deleteServer(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/server?id=${id}`);
  }

  exitServer(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/server/exit?id=${id}`);
  }

  addChannel(req: CreateChannelReq): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/server/channel`, req);
  }

  addUserGroup(req: CreateUserGroupReq): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/server/user-group`, req);
  }

  inviteUser(req: InviteUser): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/server/invite`, req);
  }

  resolveServerInvite(req: ResolveServerInvite): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/server/invite/resolve`, req);
  }
}
