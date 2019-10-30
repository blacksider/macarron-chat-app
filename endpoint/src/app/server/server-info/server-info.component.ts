import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ServerInfoService} from '../server-info.service';
import {ActivatedRoute} from '@angular/router';
import {ServerInfo, ServerRoomInfo, ServerRoomUser} from '../server-info';
import {RxWebsocketSubject, ServerRoomService} from '../server-room.service';
import {ServerMessage} from '../server-message';

@Component({
  selector: 'app-server-info',
  templateUrl: './server-info.component.html',
  styleUrls: ['./server-info.component.less']
})
export class ServerInfoComponent implements OnInit, OnDestroy {
  @ViewChild('inputMsg', {static: true}) inputMsgControl: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageContainer', {static: true}) messageContainer: ElementRef<any>;
  serverInfo: ServerInfo;
  rooms: ServerRoomInfo[];
  wsClient: RxWebsocketSubject<any>;
  currentRoom: ServerRoomInfo;
  currentRoomUsers: ServerRoomUser[] = [];
  connected = this.svrRoomService.isConnected;
  messages: ServerMessage[] = [];

  constructor(private svrService: ServerInfoService,
              private svrRoomService: ServerRoomService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.data.subscribe(value => {
      if (value.serverInfo) {
        this.serverInfo = value.serverInfo;
        this.loadRooms();
      }
    });
  }

  ngOnDestroy(): void {
    this.svrRoomService.close();
  }

  loadRooms() {
    this.svrService.listServerRooms(this.serverInfo.id).subscribe(value => {
      this.rooms = value;
      if (this.rooms.length > 0) {
        this.connectTo(this.rooms[0]);
      }
    });
  }

  connectTo(room: ServerRoomInfo) {
    this.wsClient = this.svrRoomService.connect(room);
    this.wsClient.subscribe(value => {
      this.onReceiveMessage(value);
    });
    this.currentRoom = room;
  }

  onReceiveMessage(value: ServerMessage) {
    this.messages.push(value);
    setTimeout(() => {
      const elem = this.messageContainer.nativeElement;
      elem.scrollTop = elem.scrollHeight - elem.clientHeight;
    });
  }

  sendMessage() {
    const text = this.inputMsgControl.nativeElement.value;
    const msg = ServerMessage.ofCurrentUser(text);
    this.messages.push(msg);
    this.wsClient.send(msg);
    this.inputMsgControl.nativeElement.value = '';
  }

  isInRoom(room: ServerRoomInfo) {
    return this.currentRoom === room;
  }
}
