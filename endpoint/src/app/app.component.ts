import {Component, OnInit} from '@angular/core';
import {ipcRenderer, remote, webFrame} from 'electron';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;

  constructor() {
    if (this.isElectron()) {
      this.ipcRenderer = require('electron').ipcRenderer;
      this.webFrame = require('electron').webFrame;
      this.remote = require('electron').remote;
    }
  }

  ngOnInit(): void {
    if (this.isElectron()) {
      console.log(process.env);
      console.log('Mode electron');
      console.log('Electron ipcRenderer', this.ipcRenderer);
    } else {
      console.log('Mode web');
    }
  }

  isElectron() {
    return window && window['process'] && window['process'].fromType;
  }
}
