import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';
import {switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ToastrService} from 'ngx-toastr';

@Injectable({providedIn: 'root'})
export class AuthValidatorService implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private router: Router,
              private toastr: ToastrService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const url: string = state.url;
    return this.checkLogin(url);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    return this.canActivate(childRoute, state);
  }

  checkLogin(url: string): Observable<boolean> {
    const toLogin = url.startsWith('/auth');

    if (toLogin) {
      return this.resolveToLogin();
    }

    if (this.authService.authInfo) {
      return of(true);
    }

    return this.authService.loginInfo().pipe(switchMap(res => {
      const ret = !!res;
      if (!ret) {
        this.authService.redirectUrl = url;
        this.toastr.error('用户信息获取失败');
      }
      return of(ret);
    }));
  }

  private resolveToLogin(): Observable<boolean> {
    return this.authService.loginInfo().pipe(switchMap(authInfo => {
      if (!!authInfo) {
        this.shouldJumpToMain(true);
      }
      return of(!authInfo);
    }));
  }

  /**
   * if is opening login page but already login,jump to main page,
   * and route canActive should be set to false
   * @param toLogin is opening login page
   */
  private shouldJumpToMain(toLogin: boolean): void {
    if (toLogin) {
      this.router.navigate(['/app']);
    }
  }
}
