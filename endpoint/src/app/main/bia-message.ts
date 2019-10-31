export const MESSAGE_FROM_USER = 'USER';

export class MessageFrom {
  type: string;
}

export class MessageFromUser extends MessageFrom {
  userId: number;
  username: string;
}

export const MESSAGE_TO_USER = 'USER';

export class MessageTo {
  type: string;
}

export class MessageToUser extends MessageTo {
  userId: number;
  username: string;
}

export const MESSAGE_TYPE_TEXT = 1000;
export const MESSAGE_TYPE_IMG = 1001;

export const MESSAGE_TYPE_GET_SERVERS = 2000;
export const MESSAGE_TYPE_REPLY_SERVERS = 2001;
export const MESSAGE_TYPE_GET_SERVER_CHANNELS = 2010;
export const MESSAGE_TYPE_REPLY_SERVER_CHANNELS = 2011;
export const MESSAGE_TYPE_GET_SERVER_USER_GROUP = 2020;
export const MESSAGE_TYPE_REPLY_SERVER_USER_GROUP = 2021;

export class BiaMessage {
  messageFrom: MessageFrom;
  messageTo: MessageTo;
  messageType: number;
  message: number[];
}