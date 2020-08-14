import args from 'args';
import * as fs from 'fs';
import * as path from 'path';

export class Args {

  public flags: ConfigFlags;

  constructor() {
    this.initArgs();
    this.loadConfig();
  }

  private initArgs(): void {
    args.option('port', 'Порт сервера', 3000)
      .option('host', 'Хост сервера', 'localhost')
      .option('config', 'Конфиг в формате json', './config.json');

    this.flags = args.parse(process.argv);

  }

  private loadConfig(): void {
    try {
      const file = fs.readFileSync(path.resolve(__dirname, this.flags.config), {encoding: 'utf8'});
      this.flags = Object.assign(this.flags, JSON.parse(file))
    } catch (e) {
      ;
    }
  }

}


export interface ConfigFlags {
  host: string;
  port: number;
  config: string;
}
