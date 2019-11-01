export const SERVER_USER_OWNER = 0;
export const SERVER_USER_MEMBER = 1;

export class ServerUser {
  id: number;
  username: string;
  tag: number;
  avatar: string;
}

export class ChatServerUser {
  id: number;
  user: ServerUser;
  userType: number;
}

export class ChatServerUserGroup {
  id: number;
  groupName: String;
  users: ChatServerUser[];
}

export class ServerUserGroupWrap {
  serverId: number;
  userGroups: ChatServerUserGroup[];
}
