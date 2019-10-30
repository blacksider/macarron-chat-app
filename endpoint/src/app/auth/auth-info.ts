import {AuthAuthority} from './auth-authority';

export class AuthInfo {
  userId: number;
  username: string;
  avatar: string;
  tag: number;
  authorities: Array<AuthAuthority>;
}
