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
  shutdownTimeTimestamp: number = null;

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

    this.socket.on('setVolume', (val: number) => {
      audio.speaker.set(val);
    });
    this.socket.on('volumeUp', (val: number) => {
      audio.speaker.increase(val);
    });
    this.socket.on('volumeDown', (val: number) => {
      audio.speaker.decrease(val);
    });
    this.socket.on('muteChange', (val: boolean) => {
      audio.speaker.decrease(val);
      if (val) {
        audio.speaker.mute();
      } else {
        audio.speaker.unmute();
      }
    });
    audio.speaker.events.on('change', (volume: { old: number, new: number }, fn) => {
      this.socket.emit('volumeChanged', volume.new);
    });
    audio.speaker.events.on('toggle', (toggle: { old: boolean, new: boolean }) => {
      this.socket.emit('muteChanged', toggle.new);
    });
  }

  private initShutdown(): void {
    this.socket.on('shutdown', ({ type, time = 1 }, fn) => {
      switch (type as ShutdownType) {
        case ShutdownType.Shutdown:
          execSync(`shutdown -s`);
          fn(this.makeInfo());
          break;
        case ShutdownType.CancelShutdown:
          execSync(`shutdown -a`);
          this.shutdownTimeTimestamp = null;
          fn(this.makeInfo());
          break;
        case ShutdownType.Timer:
          execSync(`shutdown -s -t ${time * 60}`);
          this.shutdownTimeTimestamp = Date.now() + (time * 60 * 1000);
          fn(this.makeInfo());
          break;
      }
    });
  }

  private initMouseControl(): void {
    this.socket.on('mouseMove', ({ deltaX, deltaY }) => {
      const { x, y } = robot.getMousePos();
      robot.moveMouse(x + deltaX, y + deltaY);
    });
    this.socket.on('mouseScroll', ({ deltaX, deltaY }) => {
      robot.scrollMouse(deltaX, deltaY);
    });
    this.socket.on('mouseLeftClick', () => {
      robot.mouseClick();
    });
    this.socket.on('mouseRightClick', () => {
      robot.mouseClick('right');
    });
    this.socket.on('mouseMiddleClick', () => {
      robot.mouseClick('middle');
    });
    this.socket.on('mouseLeftToggle', () => {
      robot.mouseToggle();
    });
  }

  private makeInfo() {
    return {
      name: this.args.flags.name,
      release: os.release(),
      platform: os.platform(),
      arch: os.arch(),
      username: os.userInfo().username,
      hostname: os.hostname(),
      volume: audio.speaker.get(),
      isMuted: audio.speaker.isMuted(),
      shutdownTime: this.shutdownTimeTimestamp
    };
  }
}


async function bootstrap() {
  const main = new Main();
}

bootstrap();

