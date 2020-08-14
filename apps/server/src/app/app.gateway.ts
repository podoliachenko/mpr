import {
  MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { AppService, UserInfo } from './app.service';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  constructor(private service: AppService) {
  }

  handleConnection(client: Client, ...args: any[]): any {
  }

  handleDisconnect(client: Client): any {
    this.service.disconnect();
  }

  @SubscribeMessage('initInfo')
  initInfo(client: Socket, data: UserInfo): void {
    this.service.setUser({ socket: client, userInfo: data });
  }

  @SubscribeMessage('volumeChange')
  volumeChange(client: Socket, @MessageBody() volume: number): void {
    this.service.connectedUser.userInfo.volume = volume;
  }
  @SubscribeMessage('toggleChange')
  toggleChange(client: Socket, @MessageBody() toggle: boolean): void {
    this.service.connectedUser.userInfo.isMuted = toggle;
  }

}
