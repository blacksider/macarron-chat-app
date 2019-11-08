export const MESSAGE_TYPE_GET_CHANNEL_PLAYERS = 100;
export const MESSAGE_TYPE_REPLY_CHANNEL_PLAYERS_CHANGE = 101;
export const MESSAGE_TYPE_VOICE_MESSAGE = 120;

export class ChannelMessage {
  type: number;
  data: number[];

  constructor(type: number, data?: any) {
    this.type = type;
    if (data) {
      this.data = data;
    }
  }
}
