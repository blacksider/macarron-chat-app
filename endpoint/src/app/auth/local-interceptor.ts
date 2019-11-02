import {Injectable, Injector} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';

import {switchMap, tap} from 'rxjs/operators';
import {ToastrService} from 'ngx-toastr';
import {Observable, timer} from 'rxjs';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LocalInterceptor implements HttpInterceptor {
  constructor(private injector: Injector,
              private router: Router,
              private toastr: ToastrService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authService = this.injector.get(AuthService);
    return authService.getAuthorizationToken()
      .pipe(switchMap(res => {
        let authReq;
        if (!!res) {
          authReq = req.clone({
            headers: req.headers.set(authService.authHeadName, res)
          });
        } else {
          authReq = req;
        }
        return this.handleResult(next, authReq, authService);
      }));
  }

  private handleResult(next: HttpHandler, authReq, authService) {
    return next.handle(authReq)
      .pipe(tap((event: HttpEvent<any>) => {
        // do nothing
      }, (err: HttpErrorResponse) => {
        switch (err.status) {
          case 400:
            this.toastr.error(err.error.message);
            break;
          case 401:
            authService.removeAuthorizationToken().subscribe(_ => {
              // jump later to avoid dead lock
              const t = timer(500);
              // tslint:disable-next-line:no-shadowed-variable
              t.subscribe(t => {
                if (!this.router.routerState.snapshot.url.startsWith('/auth')) {
                  this.router.navigate(['/auth/login']);
                }
              });
            });
            break;
          case 403:
            this.toastr.error('用户无权限');
            break;
          case 504:
            this.toastr.error('服务器连接异常');
            break;
          default:
            this.toastr.error('未知错误');
            break;
        }
      }));
  }
}
