import {AfterViewInit, Component, HostListener, OnDestroy, ViewChild} from '@angular/core';
import {ConfirmConfig} from './confirm-config';
import {ModalDirective} from 'ngx-bootstrap';
import {Observable, Subject} from 'rxjs';

@Component({
  selector: 'app-lib-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.less']
})
export class ConfirmComponent implements AfterViewInit, OnDestroy {
  subject: Subject<boolean>;
  confirmObservable: Observable<boolean>;
  config: ConfirmConfig;
  complete: () => void;
  @ViewChild('confirmModal', {static: true}) confirmModal: ModalDirective;

  ngAfterViewInit(): void {
    this.confirmModal.show();
  }

  @HostListener('keyup.enter') confirm() {
    this.accept();
  }

  accept() {
    this.confirmModal.hide();
    this.subject.next(true);
    this.complete();
    this.config = null;
  }

  reject() {
    this.confirmModal.hide();
    this.subject.next(false);
    this.complete();
    this.config = null;
  }

  ngOnDestroy(): void {
    this.subject.unsubscribe();
  }
}

