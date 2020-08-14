import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

export interface UserInfo {
  release: string;
  platform: string;
  arch: string;
  username: string;
  hostname: string;
  volume: number;
  isMuted: boolean;
}

export interface ConnectedUser {
  socket: Socket;
  userInfo: UserInfo;
}

@Injectable()
export class AppService {
  connectedUser: ConnectedUser;

  constructor() {
  }

  setUser(user: ConnectedUser) {
    this.connectedUser = user;
    Logger.log(`Client connected ${this.connectedUser.userInfo.hostname}`, 'Connection')
    Logger.log(this.connectedUser.userInfo, 'Info')
  }

  disconnect() {
    Logger.log(`Client disconnected ${this.connectedUser.userInfo.hostname}`, 'Connection')
    this.connectedUser = null;
  }

}
