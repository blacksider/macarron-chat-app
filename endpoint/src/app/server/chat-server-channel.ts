import {ServerUser} from './chat-server-users';

export class ChatServerChannel {
  id: number;
  channelName: string;
}

export class ServerChannelWrap {
  serverId: number;
  channels: ChatServerChannel[];
  channelUsers: { [key: string]: ServerUser[] };
}
