import {Injectable} from '@angular/core';
import {interval, Observable, Observer, Subject} from 'rxjs';
import {WebSocketSubject, WebSocketSubjectConfig} from 'rxjs/webSocket';
import {ServerRoomInfo} from './server-info';
import {ServerMessage} from './server-message';
import {distinctUntilChanged, share, takeWhile} from 'rxjs/operators';
import {AuthService} from '../auth/auth.service';

export class RxWebsocketSubject<T> extends Subject<T> {
  private reconnectionObservable: Observable<number>;
  private wsSubjectConfig: WebSocketSubjectConfig<T>;
  private socket: WebSocketSubject<any>;
  private connectionObserver: Observer<boolean>;
  public connectionStatus: Observable<boolean>;

  constructor(
    private url: string,
    private authService: AuthService,
    private reconnectInterval: number = 5000,
    private reconnectAttempts: number = 10) {
    super();
    this.connectionStatus = new Observable<boolean>((observer) => {
      this.connectionObserver = observer;
    }).pipe(
      share(),
      distinctUntilChanged()
    );

    this.wsSubjectConfig = {
      url: url,
      closeObserver: {
        next: () => {
          this.socket = null;
          this.connectionObserver.next(false);
        }
      },
      openObserver: {
        next: () => {
          this.connectionObserver.next(true);
        }
      }
    };
    this.connect();
    this.connectionStatus.subscribe((isConnected) => {
      if (!this.reconnectionObservable && typeof (isConnected) === 'boolean' && !isConnected) {
        this.reconnect();
      }
    });
  }

  connect(): void {
    this.authService.getAuthorizationToken().subscribe(token => {
      if (!!token) {
        const config = Object.assign({}, this.wsSubjectConfig, {
          url: `${this.wsSubjectConfig.url}&${this.authService.authHeadName}=${token}`
        });
        this.socket = new WebSocketSubject(config);
        this.socket.subscribe(
          (m) => {
            this.next(m);
          },
          () => {
            if (!this.socket) {
              this.reconnect();
            }
          });
      }
    });
  }

  reconnect(): void {
    this.reconnectionObservable = interval(this.reconnectInterval)
      .pipe(
        takeWhile((v, index) => {
            return index < this.reconnectAttempts && !this.socket;
          }
        ));
    this.reconnectionObservable.subscribe(() => {
        this.connect();
      },
      () => {
      },
      () => {
        this.reconnectionObservable = null;
        if (!this.socket) {
          this.complete();
          this.connectionObserver.complete();
        }
      });
  }

  send(data: T): void {
    this.socket.next(data);
  }

  close() {
    this.complete();
    this.connectionObserver.complete();
    if (this.socket) {
      this.socket.unsubscribe();
    }
    this.unsubscribe();
  }
}

@Injectable()
export class ServerRoomService {
  private wsUrl: string;
  private connected: boolean;
  private socket: RxWebsocketSubject<ServerMessage>;

  constructor(private authService: AuthService) {
  }

  connect(room: ServerRoomInfo): RxWebsocketSubject<ServerMessage> {
    const url = `ws://${location.host}/ws/connect?room=` + room.id;
    if (url === this.wsUrl) {
      if (!this.socket) {
        this.newConnection();
      } else {
        this.connected = true;
      }
    } else {
      if (!!this.socket) {
        this.socket.complete();
      }
      this.wsUrl = url;
      this.newConnection();
    }
    return this.socket;
  }

  private newConnection() {
    this.socket = new RxWebsocketSubject<ServerMessage>(this.wsUrl, this.authService);
    this.socket.connectionStatus.subscribe(connected => {
      this.connected = connected;
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  close() {
    if (!!this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
