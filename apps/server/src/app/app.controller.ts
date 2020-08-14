import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { isNullOrUndefined } from 'util';

@Controller()
export class AppController {

  constructor(private service: AppService) {
  }

  @Get('volume')
  getVolume() {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    return this.service.connectedUser.userInfo.volume;
  }

  @Get('muted')
  getMuted() {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    return this.service.connectedUser.userInfo.isMuted;
  }

  @Post('volume')
  setVolume(@Body('volume') volume: number, @Body('delta') delta: number, @Body('mute') mute: boolean) {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    if (volume) {
      this.service.connectedUser.socket.emit('setVolume', volume);
    } else if (delta) {
      if (delta > 0) {
        this.service.connectedUser.socket.emit('volumeUp', delta);
      } else {
        this.service.connectedUser.socket.emit('volumeDown', Math.abs(delta));
      }
    } else if (!isNullOrUndefined(mute)) {
      this.service.connectedUser.socket.emit('muteChange', mute);
    }
  }

  @Post('shutdown')
  shutdown(@Body('type') type = 0, @Body('time') time = 1) {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    this.service.connectedUser.socket.emit('shutdown', { type, time });
  }

  @Get('connected')
  connected() {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    return this.service.connectedUser.userInfo;
  }
}
