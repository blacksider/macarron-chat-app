import {EventEmitter, Injectable} from '@angular/core';
import {ChatServer} from './chat-server';
import {ChatServerChannel} from './chat-server-channel';
import {Observable, of} from 'rxjs';
import {filter, mergeMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ServerInfoService {
  private servers: ChatServer[];
  private serverChange = new EventEmitter<ChatServer[]>();
  private serverChannels: Map<number, ChatServerChannel[]>;
  private serverChannelsChange = new EventEmitter<Map<number, ChatServerChannel[]>>();

  constructor() {
    this.servers = [];
    this.serverChannels = new Map<number, ChatServerChannel[]>();
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
    const findSvr = this.servers.find(value => value.id === serverId);
    if (findSvr) {
      return of(findSvr);
    }
    return this.serverChange.pipe(
      mergeMap((servers, i) => {
        return of(this.servers.find(value => value.id === serverId));
      }),
      filter(value => !!value)
    );
  }

  appendChannels(serverId: number, channels: ChatServerChannel[]) {
    this.serverChannels.set(serverId, channels);
    this.serverChannelsChange.emit(this.serverChannels);
  }

  getChannels(serverId: number): Observable<ChatServerChannel[]> {
    const findC = this.serverChannels.get(serverId);
    if (!!findC) {
      return of(findC);
    }
    return this.serverChannelsChange.pipe(
      mergeMap((channelMap) => {
        return of(channelMap.get(serverId));
      }),
      filter(value => !!value)
    );
  }
}
