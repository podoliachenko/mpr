import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

export interface UserInfo {
  name: string;
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
    Logger.debug(`Client connected name: ${this.connectedUser.userInfo.name}, id: ${user.socket.id}`, 'Client')
  }

  disconnect() {
    Logger.debug(`Client disconnected name: ${this.connectedUser.userInfo.name}, id: ${this.connectedUser.socket.id}`, 'Connection')
    this.connectedUser = null;
  }

}
