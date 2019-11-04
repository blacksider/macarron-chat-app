export const MESSAGE_FROM_USER = 'USER';

export class MessageFrom {
  type: string;
}

export class MessageFromUser extends MessageFrom {
  userId: number;
  username: string;
}

export const MESSAGE_TO_USER = 'USER';
export const MESSAGE_TO_SERVER_CHANNEL = 'SERVER_CHANNEL';

export class MessageTo {
  type: string;
}

export class MessageToUser extends MessageTo {
  userId: number;
  username: string;
}

export class MessageToServerChannel extends MessageTo {
  serverId: number;
  channelId: number;
}

export const MESSAGE_TYPE_TEXT = 1000;
export const MESSAGE_TYPE_IMG = 1001;

export const MESSAGE_TYPE_GET_SERVERS = 2000;
export const MESSAGE_TYPE_REPLY_SERVERS = 2001;
export const MESSAGE_TYPE_GET_SERVER_CHANNELS = 2010;
export const MESSAGE_TYPE_REPLY_SERVER_CHANNELS = 2011;
export const MESSAGE_TYPE_GET_SERVER_USER_GROUP = 2020;
export const MESSAGE_TYPE_REPLY_SERVER_USER_GROUP = 2021;
export const MESSAGE_TYPE_SERVER_INVITE = 3000;
export const MESSAGE_TYPE_ON_VOICE_RTC_CONN = 4000;
export const MESSAGE_TYPE_ON_PLAYER_JOIN_CHANNEL = 5000;
export const MESSAGE_TYPE_ON_PLAYER_LEFT_CHANNEL = 5001;
export const MESSAGE_TYPE_PLAYER_JOIN_CHANNEL = 5100;
export const MESSAGE_TYPE_PLAYER_LEFT_CHANNEL = 5101;

export class BiaMessage {
  messageFrom: MessageFrom;
  messageTo: MessageTo;
  messageType: number;
  time: number;
  message: number[];
}
