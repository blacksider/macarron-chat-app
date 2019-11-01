import {EventEmitter, Injectable} from '@angular/core';
import {ChatServer} from './chat-server';
import {ChatServerChannel} from './chat-server-channel';
import {merge, Observable, of} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {ChatServerUserGroup} from './chat-server-users';

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

  constructor() {
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
}
