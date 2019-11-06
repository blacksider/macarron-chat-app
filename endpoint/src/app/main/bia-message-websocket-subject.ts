import {interval, Observable, Observer, Subject} from 'rxjs';
import {WebSocketSubject, WebSocketSubjectConfig} from 'rxjs/webSocket';
import {AuthService} from '../auth/auth.service';
import {distinctUntilChanged, share, takeUntil, takeWhile} from 'rxjs/operators';
import {EventEmitter} from '@angular/core';

export function strToUtf8Bytes(str: string): number[] {
  const bytes = [];
  const len = str.length;
  for (let i = 0; i < len; ++i) {
    const code = str.charCodeAt(i);
    if (code >= 0x10000 && code <= 0x10ffff) {
      bytes.push((code >> 18) | 0xf0);
      bytes.push(((code >> 12) & 0x3f) | 0x80);
      bytes.push(((code >> 6) & 0x3f) | 0x80);
      bytes.push((code & 0x3f) | 0x80);
    } else if (code >= 0x800 && code <= 0xffff) {
      bytes.push((code >> 12) | 0xe0);
      bytes.push(((code >> 6) & 0x3f) | 0x80);
      bytes.push((code & 0x3f) | 0x80);
    } else if (code >= 0x80 && code <= 0x7ff) {
      bytes.push((code >> 6) | 0xc0);
      bytes.push((code & 0x3f) | 0x80);
    } else {
      bytes.push(code);
    }
  }

  return bytes;
}

export function utf8ByteToUnicodeStr(utf8Bytes: ArrayLike<number>): string {
  let unicodeStr = '';
  for (let pos = 0; pos < utf8Bytes.length;) {
    const flag = utf8Bytes[pos];
    let unicode = 0;
    if ((flag >>> 7) === 0) {
      unicodeStr += String.fromCharCode(utf8Bytes[pos]);
      pos += 1;

    } else if ((flag & 0xFC) === 0xFC) {
      unicode = (utf8Bytes[pos] & 0x3) << 30;
      unicode |= (utf8Bytes[pos + 1] & 0x3F) << 24;
      unicode |= (utf8Bytes[pos + 2] & 0x3F) << 18;
      unicode |= (utf8Bytes[pos + 3] & 0x3F) << 12;
      unicode |= (utf8Bytes[pos + 4] & 0x3F) << 6;
      unicode |= (utf8Bytes[pos + 5] & 0x3F);
      unicodeStr += String.fromCharCode(unicode);
      pos += 6;

    } else if ((flag & 0xF8) === 0xF8) {
      unicode = (utf8Bytes[pos] & 0x7) << 24;
      unicode |= (utf8Bytes[pos + 1] & 0x3F) << 18;
      unicode |= (utf8Bytes[pos + 2] & 0x3F) << 12;
      unicode |= (utf8Bytes[pos + 3] & 0x3F) << 6;
      unicode |= (utf8Bytes[pos + 4] & 0x3F);
      unicodeStr += String.fromCharCode(unicode);
      pos += 5;

    } else if ((flag & 0xF0) === 0xF0) {
      unicode = (utf8Bytes[pos] & 0xF) << 18;
      unicode |= (utf8Bytes[pos + 1] & 0x3F) << 12;
      unicode |= (utf8Bytes[pos + 2] & 0x3F) << 6;
      unicode |= (utf8Bytes[pos + 3] & 0x3F);
      unicodeStr += String.fromCharCode(unicode);
      pos += 4;

    } else if ((flag & 0xE0) === 0xE0) {
      unicode = (utf8Bytes[pos] & 0x1F) << 12;
      unicode |= (utf8Bytes[pos + 1] & 0x3F) << 6;
      unicode |= (utf8Bytes[pos + 2] & 0x3F);
      unicodeStr += String.fromCharCode(unicode);
      pos += 3;

    } else if ((flag & 0xC0) === 0xC0) { // 110
      unicode = (utf8Bytes[pos] & 0x3F) << 6;
      unicode |= (utf8Bytes[pos + 1] & 0x3F);
      unicodeStr += String.fromCharCode(unicode);
      pos += 2;

    } else {
      unicodeStr += String.fromCharCode(utf8Bytes[pos]);
      pos += 1;
    }
  }
  return unicodeStr;
}

export function str2ArrayBuffer(str: string): ArrayBuffer {
  const utf8Arr = encodeUtf8(JSON.stringify(str));
  const buf = new ArrayBuffer(utf8Arr.length);
  const bufView = new Int8Array(buf);
  for (let i = 0, strLen = utf8Arr.length; i < strLen; i++) {
    bufView[i] = utf8Arr[i];
  }
  return buf;
}

export function encodeUtf8(text: string): number[] {
  const code = encodeURIComponent(text);
  const bytes = [];
  for (let i = 0; i < code.length; i++) {
    const c = code.charAt(i);
    if (c === '%') {
      const hex = code.charAt(i + 1) + code.charAt(i + 2);
      const hexVal = parseInt(hex, 16);
      bytes.push(hexVal);
      i += 2;
    } else {
      bytes.push(c.charCodeAt(0));
    }
  }
  return bytes;
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
  private reconnectAttempts = Number.MAX_VALUE;
  isReady = false;
  ready = new EventEmitter<boolean>();

  id: number;

  static defaultSerializer(value) {
    return str2ArrayBuffer(value);
  }

  static defaultDeserializer(e) {
    const arr = new Int8Array(e.data);
    return JSON.parse(utf8ByteToUnicodeStr(arr));
  }

  constructor(
    private url: string,
    private authToken: string,
    private authService: AuthService,
    serializer?: (value: T) => any,
    deserializer?: (e: MessageEvent) => T) {
    super();
    this.id = new Date().getTime() + Math.random();
    this.unSubscribe = new Subject();
    this.wsSubjectConfig = {
      url: '',
      binaryType: 'arraybuffer',
      serializer: serializer ? serializer : BiaMessageWebsocketSubject.defaultSerializer,
      deserializer: deserializer ? deserializer : BiaMessageWebsocketSubject.defaultDeserializer,
      closeObserver: {
        next: this.onClose.bind(this)
      },
      openObserver: {
        next: this.onOpen.bind(this)
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

  private onOpen() {
    this.connectionObserver.next(true);
    this.isReady = true;
    this.ready.emit(this.isReady);
  }

  private onClose() {
    this.socket = null;
    this.connectionObserver.next(false);
    this.isReady = false;
    this.ready.emit(this.isReady);
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

  send(value?: T): void {
    this.socket.next(value);
  }

  complete() {
    super.complete();
    this.unSubscribe.next();
    this.unSubscribe.complete();
    if (this.socket) {
      this.socket.unsubscribe();
    }
  }
}
