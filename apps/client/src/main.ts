import { Args } from './app/Args';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import io from 'socket.io-client';
import Socket = SocketIOClient.Socket;
import * as os from 'os';
import * as audio from 'win-audio';
import { execSync } from 'child_process';

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
  }

  private initSocket(): void {
    console.log(`Connecting to server ${this.args.flags.host}:${this.args.flags.port}`);
    this.socket = io(`http://${this.args.flags.host}:${this.args.flags.port}`);
    this.socket.on('connect', () => {
      console.log(`Connected to server http://${this.args.flags.host}:${this.args.flags.port}`);
      this.socket.emit('initInfo', {
        release: os.release(),
        platform: os.platform(),
        arch: os.arch(),
        username: os.userInfo().username,
        hostname: os.hostname(),
        volume: audio.speaker.get(),
        isMuted: audio.speaker.isMuted()
      });
    });
  }

  private initVolume(): void {
    audio.speaker.polling();

    this.socket.on('setVolume', (val: number) => {
      audio.speaker.set(val);
      this.socket.emit('volumeChange', audio.speaker.get());
    });
    this.socket.on('volumeUp', (val: number) => {
      audio.speaker.increase(val);
      this.socket.emit('volumeChange', audio.speaker.get());
    });
    this.socket.on('volumeDown', (val: number) => {
      audio.speaker.decrease(val);
      this.socket.emit('volumeChange', audio.speaker.get());
    });
    this.socket.on('muteChange', (val: boolean) => {
      audio.speaker.decrease(val);
      if (val) {
        audio.speaker.mute();
      } else {
        audio.speaker.unmute();
      }
      this.socket.emit('toggleChange', audio.speaker.isMuted());
    });
    audio.speaker.events.on('change', (volume: { old: number, new: number }) => {
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
}


async function bootstrap() {
  const main = new Main();
}

bootstrap();

