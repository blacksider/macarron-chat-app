export enum FromType {
  CURRENT_USER = 'CURRENT_USER',
  RESPONSE = 'RESPONSE',
}

export class ServerMessage {
  from: string;
  fromType: FromType;
  message: any;
  time: Date;

  public static ofCurrentUser(message: string): ServerMessage {
    return {
      from: 'me',
      fromType: FromType.CURRENT_USER,
      message: message,
      time: new Date()
    };
  }

  public static ofResponse(message: string): ServerMessage {
    return {
      from: 'server',
      fromType: FromType.RESPONSE,
      message: message,
      time: new Date()
    };
  }
}
