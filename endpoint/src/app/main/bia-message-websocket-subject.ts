import {interval, Observable, Observer, Subject} from 'rxjs';
import {WebSocketSubject, WebSocketSubjectConfig} from 'rxjs/webSocket';
import {AuthService} from '../auth/auth.service';
import {distinctUntilChanged, share, takeUntil, takeWhile} from 'rxjs/operators';
import {EventEmitter} from '@angular/core';

export function arrayBuffer2Str(buf: ArrayBuffer): string {
  console.log(new Int8Array(buf));
  return String.fromCharCode.apply(null, new Int8Array(buf));
}

export function str2ArrayBuffer(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Int8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function str2ByteArray(str: string): number[] {
  const bufView = [];
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

export function byteArray2Str(array: number[]): string {
  let result = '';
  for (let i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

export class BiaMessageWebsocketSubject<T> extends Subject<T> {
  private unSubscribe;
  private wsSubjectConfig: WebSocketSubjectConfig<T>;
  private reconnectionObservable: Observable<number>;
  private connectionObserver: Observer<boolean>;
  public connectionStatus: Observable<boolean>;
  private socket: WebSocketSubject<T>;
  private reconnectInterval = 5000;
  private reconnectAttempts = 10;
  ready = new EventEmitter<boolean>();

  static defaultSerializer(value) {
    return str2ArrayBuffer(JSON.stringify(value));
  }

  static defaultDeserializer(e) {
    return JSON.parse(arrayBuffer2Str(e.data));
  }

  constructor(
    private url: string,
    private authToken: string,
    private authService: AuthService,
    serializer?: (value: T) => any,
    deserializer?: (e: MessageEvent) => T) {
    super();
    this.unSubscribe = new Subject();
    this.wsSubjectConfig = {
      url: '',
      binaryType: 'arraybuffer',
      serializer: serializer ? serializer : BiaMessageWebsocketSubject.defaultSerializer,
      deserializer: deserializer ? deserializer : BiaMessageWebsocketSubject.defaultDeserializer,
      closeObserver: {
        next: () => {
          this.socket = null;
          this.connectionObserver.next(false);
          this.ready.emit(false);
        }
      },
      openObserver: {
        next: () => {
          this.connectionObserver.next(true);
          this.ready.emit(true);
        }
      }
    };
    this.connectionStatus = new Observable<boolean>((observer) => {
      this.connectionObserver = observer;
    }).pipe(
      share(),
      distinctUntilChanged(),
      takeUntil(this.unSubscribe)
    );
    this.connect();
    this.connectionStatus.subscribe((isConnected) => {
      if (!this.reconnectionObservable && typeof (isConnected) === 'boolean' && !isConnected) {
        this.reconnect();
      }
    });
  }

  private connect(): void {
    const config = Object.assign({}, this.wsSubjectConfig, {
      url: `${this.url}${this.url.indexOf('?') !== -1 ? '&' : '?'}${this.authService.authHeadName}=${this.authToken}`
    });
    this.socket = new WebSocketSubject(config);
    this.socket.pipe(
      takeUntil(this.unSubscribe)
    );
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

  private reconnect(): void {
    this.reconnectionObservable = interval(this.reconnectInterval)
      .pipe(
        takeWhile((v, index) => {
            return index < this.reconnectAttempts && !this.socket;
          }
        ),
        takeUntil(this.unSubscribe));
    this.reconnectionObservable.subscribe(() => {
      this.connect();
    });
  }

  next(value?: T): void {
    super.next(value);
    this.socket.next(value);
  }

  complete() {
    super.complete();
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }
}
