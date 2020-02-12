import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private _selectedAudioInput = 'default';
  private _selectedAudioOutput = 'default';
  private _selectedVideoInput: MediaDeviceInfo = null;

  constructor() {
  }

  get selectedAudioInput(): any {
    return this._selectedAudioInput;
  }

  set selectedAudioInput(value: any) {
    this._selectedAudioInput = value;
  }

  get selectedAudioOutput(): any {
    return this._selectedAudioOutput;
  }

  set selectedAudioOutput(value: any) {
    this._selectedAudioOutput = value;
  }

  get selectedVideoInput(): MediaDeviceInfo {
    return this._selectedVideoInput;
  }

  set selectedVideoInput(value: MediaDeviceInfo) {
    this._selectedVideoInput = value;
  }
}
