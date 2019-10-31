export class ChatServerChannel {
  id: string;
  channelName: string;
}

export class ServerChannelWrap {
  serverId: number;
  channels: ChatServerChannel[];
}
