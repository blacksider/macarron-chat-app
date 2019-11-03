import {ChatServer} from '../server/chat-server';

export class InviteToServerWrap {
  inviteId: string;
  userId: number;
  toServer: ChatServer;
}
