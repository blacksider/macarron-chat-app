import {Component, OnInit} from '@angular/core';
import {ServerService} from '../server.service';
import {ServerInfo} from '../../server/server-info';
import {AuthService} from '../../auth/auth.service';
import {AuthInfo} from '../../auth/auth-info';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.less']
})
export class MainComponent implements OnInit {
  servers: ServerInfo[];
  authInfo: AuthInfo;

  constructor(private serverService: ServerService,
              private authService: AuthService) {
  }

  ngOnInit(): void {
    // this.loadServers();
    this.authInfo = this.authService.authInfo;
  }

  loadServers() {
    this.serverService.listServers().subscribe(value => {
      this.servers = value;
    });
  }
}
