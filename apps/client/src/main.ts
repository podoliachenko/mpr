import { Args } from './app/Args';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import io from 'socket.io-client';
import * as os from 'os';
import * as audio from 'win-audio';
import { execSync } from 'child_process';
import * as robot from 'robotjs';
import Socket = SocketIOClient.Socket;

enum ShutdownType {
  Shutdown,
  CancelShutdown,
  Timer
}

class Main {

  socket: Socket;
  args: Args;

  constructor() {
    this.args = new Args();
    this.initSocket();
    this.initVolume();
    this.initShutdown();
    this.initMouseControl();
  }

  private initSocket(): void {
    console.log(`Connecting to server ${this.args.flags.host}:${this.args.flags.port}`);
    this.socket = io(`http://${this.args.flags.host}:${this.args.flags.port}`);
    this.socket.on('connect', () => {
      console.log(`Connected to server http://${this.args.flags.host}:${this.args.flags.port}`);
      this.socket.emit('initInfo', this.makeInfo());
    });
  }

  private initVolume(): void {
    audio.speaker.polling();

    this.socket.on('setVolume', (val: number, fn) => {
      audio.speaker.set(val);
      fn(this.makeInfo());
    });
    this.socket.on('volumeUp', (val: number, fn) => {
      audio.speaker.increase(val);
      fn(this.makeInfo());
    });
    this.socket.on('volumeDown', (val: number, fn) => {
      audio.speaker.decrease(val);
      fn(this.makeInfo());
    });
    this.socket.on('muteChange', (val: boolean, fn) => {
      audio.speaker.decrease(val);
      if (val) {
        audio.speaker.mute();
      } else {
        audio.speaker.unmute();
      }
      fn(this.makeInfo());
    });
    audio.speaker.events.on('change', (volume: { old: number, new: number }, fn) => {
      this.socket.emit('volumeChange', volume.new);
    });
    audio.speaker.events.on('toggle', (toggle: { old: boolean, new: boolean }) => {
      this.socket.emit('toggleChange', toggle.new);
    });
  }

  private initShutdown(): void {
    this.socket.on('shutdown', ({ type, time = 1 }) => {
      switch (type as ShutdownType) {
        case ShutdownType.Shutdown:
          execSync(`shutdown -s`);
          break;
        case ShutdownType.CancelShutdown:
          execSync(`shutdown -a`);
          break;
        case ShutdownType.Timer:
          execSync(`shutdown -s -t ${time * 60}`);
          break;
      }
    });
  }

  private initMouseControl(): void {
    this.socket.on('mouseMove', ({ deltaX, deltaY }) => {
      console.log(deltaX, deltaY);
      const {x, y} = robot.getMousePos()
      robot.moveMouse(x + deltaX, y+ deltaY);
    });
  }

  private makeInfo() {
    return {
      release: os.release(),
      platform: os.platform(),
      arch: os.arch(),
      username: os.userInfo().username,
      hostname: os.hostname(),
      volume: audio.speaker.get(),
      isMuted: audio.speaker.isMuted()
    };
  }
}


async function bootstrap() {
  const main = new Main();
}

bootstrap();

