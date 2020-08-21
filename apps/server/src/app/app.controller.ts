import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
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
  async setVolume(@Body('volume') volume: number, @Body('delta') delta: number, @Body('mute') mute: boolean) {
    return new Promise((resolve, reject) => {
      if (!this.service.connectedUser) {
        reject(new HttpException('Client not connected', HttpStatus.FORBIDDEN));
      }
      if (volume) {
        this.service.connectedUser.socket.emit('setVolume', volume, (info) => {
          this.service.connectedUser.userInfo = info;
          resolve(info);
        });
      } else if (delta) {
        if (delta > 0) {
          this.service.connectedUser.socket.emit('volumeUp', delta, (info) => {
            this.service.connectedUser.userInfo = info;
            resolve(info);
          });
        } else {
          this.service.connectedUser.socket.emit('volumeDown', Math.abs(delta), (info) => {
            this.service.connectedUser.userInfo = info;
            resolve(info);
          });
        }
      } else if (!isNullOrUndefined(mute)) {
        this.service.connectedUser.socket.emit('muteChange', mute, (info) => {
          this.service.connectedUser.userInfo = info;
          resolve(info);
        });
      } else {
        reject(new HttpException('Parametrs not found', HttpStatus.NOT_FOUND));
      }
    });
  }

  @Post('shutdown')
  shutdown(@Body('type') type = 0, @Body('time') time = 1) {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    this.service.connectedUser.socket.emit('shutdown', { type, time }, (client) => {
      this.service.connectedUser.userInfo = client;
    });
  }

  @Get('connected')
  connected() {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    return this.service.connectedUser.userInfo;
  }

  @Post('mouse-move')
  mouse(@Body('deltaX') deltaX, @Body('deltaY') deltaY) {
    if (!this.service.connectedUser) {
      throw new HttpException('Client not connected', HttpStatus.FORBIDDEN);
    }
    this.service.connectedUser.socket.emit('mouseMove', { deltaX, deltaY });
  }
}
