import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { AppService, UserInfo } from './app.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(private service: AppService) {
  }

  handleConnection(client: Client, ...args: any[]) {
    ;
    Logger.debug(`Socket connected ${client.id}`, 'Socket');
  }

  handleDisconnect(client: Client): any {
    if (client.id == this.service.connectedUser.socket.id) {
      this.service.disconnect();
    }
    Logger.debug(`Socket disconnected ${client.id}`, 'Socket');
  }

  @SubscribeMessage('initInfo')
  initInfo(client: Socket, data: UserInfo): void {
    this.service.setUser({ socket: client, userInfo: data });
    this.server.emit('getInfoTarget@', this.service.connectedUser.userInfo);
  }

  @SubscribeMessage('volumeChange')
  volumeChange(client: Socket, volume: number): void {
    this.service.connectedUser.userInfo.volume = volume;
    this.server.emit('getInfoTarget@', this.service.connectedUser.userInfo);
  }

  @SubscribeMessage('toggleChange')
  toggleChange(client: Socket, toggle: boolean): void {
    this.service.connectedUser.userInfo.isMuted = toggle;
    this.server.emit('getInfoTarget@', this.service.connectedUser.userInfo);
  }

  @SubscribeMessage('mouseMoveTarget')
  mouseMove(client: Socket, { deltaX, deltaY }): void {
    this.service.connectedUser.socket.emit('mouseMove', { deltaX, deltaY });
  }

  @SubscribeMessage('mouseScrollTarget')
  mouseScroll(client: Socket, { deltaX, deltaY }): void {
    this.service.connectedUser.socket.emit('mouseScroll', { deltaX, deltaY });
  }

  @SubscribeMessage('getInfoTarget')
  initClientIfo(client: Socket): void {
    this.server.emit('getInfoTarget@', this.service.connectedUser.userInfo);
  }

  @SubscribeMessage('mouseLeftClickTarget')
  mouseLeftClick(client: Socket): void {
    this.service.connectedUser.socket.emit('mouseLeftClick');
  }

  @SubscribeMessage('mouseRightClickTarget')
  mouseRightClick(client: Socket): void {
    this.service.connectedUser.socket.emit('mouseRightClick');
  }

  @SubscribeMessage('mouseMiddleClickTarget')
  rightClickTarget(client: Socket): void {
    this.service.connectedUser.socket.emit('mouseMiddleClick');
  }

  @SubscribeMessage('mouseLeftToggleTarget')
  mouseLeftToggle(client: Socket): void {
    this.service.connectedUser.socket.emit('mouseLeftToggle');
  }
}
