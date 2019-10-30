import {ApplicationRef, ComponentFactoryResolver, ComponentRef, EmbeddedViewRef, Injectable, Injector} from '@angular/core';
import {ConfirmConfig} from './confirm-config';
import {ConfirmComponent} from './confirm.component';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class ConfirmService {
  private componentRef: ComponentRef<any>;
  private config: ConfirmConfig;
  private defaultConfig: ConfirmConfig = {
    title: '警告',
    message: '确定该操作？',
    okBtn: true,
    okBtnText: '确定',
    noBtn: true,
    noBtnText: '取消'
  };

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private appRef: ApplicationRef,
              private injector: Injector) {
  }

  confirm(config?: ConfirmConfig): Observable<boolean> {
    this.config = config;
    if (!this.config) {
      this.config = this.defaultConfig;
    } else {
      this.config = Object.assign({}, this.defaultConfig, this.config);
    }
    this.appendComponentToBody();
    return this.componentRef.instance.confirmObservable;
  }

  complete() {
    this.removeComponent();
  }

  appendComponentToBody() {
    this.componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ConfirmComponent)
      .create(this.injector);

    this.componentRef.instance.config = this.config;
    this.componentRef.instance.complete = this.complete.bind(this);
    const subject = new Subject<boolean>();
    this.componentRef.instance.subject = subject;
    this.componentRef.instance.confirmObservable = subject.asObservable();

    this.appRef.attachView(this.componentRef.hostView);
    const domElem = (this.componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);
  }

  removeComponent() {
    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
  }
}
