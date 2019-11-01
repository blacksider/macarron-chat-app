import {Component, OnInit} from '@angular/core';
import {ElectronService} from 'ngx-electron';

@Component({
  selector: 'app-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.less']
})
export class TitleBarComponent implements OnInit {
  max = false;

  constructor(private electron: ElectronService) {
  }

  ngOnInit() {
  }


  closeWindow() {
    this.electron.remote.BrowserWindow.getFocusedWindow().close();
  }

  maximizeWindow() {
    if (this.max) {
      this.electron.remote.BrowserWindow.getFocusedWindow().unmaximize();
      this.max = false;
      return;
    }
    this.electron.remote.BrowserWindow.getFocusedWindow().maximize();
    this.max = true;
  }

  minimizeWindow() {
    this.electron.remote.BrowserWindow.getFocusedWindow().minimize();
  }
}
