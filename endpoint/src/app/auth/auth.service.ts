import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {LocalStorage} from '@ngx-pwa/local-storage';
import {ToastrService} from 'ngx-toastr';
import {AuthReq} from './auth-req';
import {AuthInfo} from './auth-info';
import {NgxPermissionsService} from 'ngx-permissions';
import {Observable, of} from 'rxjs';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {UserRegister} from './user-register';

// must be provided in root module
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authInfo: AuthInfo;
  redirectUrl: string;
  authHeadName = 'x-auth-token';
  authCacheKey = 'Auth_Token';

  constructor(private http: HttpClient,
              private localStorage: LocalStorage,
              private toastr: ToastrService,
              private permissionsService: NgxPermissionsService) {
  }

  register(req: UserRegister): Observable<any> {
    const cloned = Object.assign({}, req);
    cloned.password = window.btoa(req.password);
    return this.http.post('/api/auth/register', cloned);
  }


  login(req: AuthReq): Observable<AuthInfo> {
    const cloned = Object.assign({}, req);
    cloned.password = window.btoa(req.password);
    return this.http.post('/api/auth/login', cloned, {observe: 'response'})
      .pipe(
        switchMap(res => {
          if (!!res) {
            const authToken = res.headers.get(this.authHeadName);
            return this.localStorage.setItem(this.authCacheKey, authToken)
              .pipe(switchMap<boolean, Observable<AuthInfo>>(ret => {
                return this.loginInfo();
              }));
          }
          return of(null);
        }),
        catchError(() => {
          return of(null);
        })
      );
  }

  loginInfo(): Observable<AuthInfo> {
    return this.http.get<AuthInfo>('/api/auth/info')
      .pipe(
        tap(res => {
          if (!!res) {
            this.authInfo = res;
            this.authInfo.authorities.sort((a, b) => {
              return a.id - b.id;
            });
            const permissions = this.authInfo.authorities.map(value => value.authority);
            this.permissionsService.loadPermissions(permissions);
          }
        }),
        catchError(() => of(null))
      );
  }

  logout(): Observable<boolean> {
    return this.http.get('/api/auth/logout', {observe: 'response'})
      .pipe(
        catchError(this.handleError('退出异常', null)),
        switchMap<HttpResponse<any>, Observable<boolean>>(res => {
          if (res.status === 200) {
            return this.removeAuthorizationToken();
          }
          return of(false);
        })
      );
  }

  removeAuthorizationToken(): Observable<boolean> {
    this.authInfo = null;
    return this.localStorage.removeItem(this.authCacheKey);
  }

  getAuthorizationToken(): Observable<any> {
    return this.localStorage.getItem<string>(this.authCacheKey);
  }

  private handleError<T>(operation: string, result?: T): any {
    return (error: any): Observable<T> => {
      this.toastr.error(`${operation}`);
      return of(result as T);
    };
  }
}
