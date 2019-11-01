export class ChatServerChannel {
  id: number;
  channelName: string;
}

export class ServerChannelWrap {
  serverId: number;
  channels: ChatServerChannel[];
}
