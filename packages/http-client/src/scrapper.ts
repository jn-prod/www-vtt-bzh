import { type IClient, type IRequest, client } from '.';
import { parseHTML } from 'linkedom';

export class Scrapper {
  public client: IRequest;
  public response: unknown;
  constructor(baseUrl: Parameters<IClient>[0]) {
    if (!URL.canParse(baseUrl)) {
      throw new Error('Scrapper - baseUrl param must a valid URL');
    } else {
      this.client = client(baseUrl);
    }
  }

  public async request(uri: Parameters<IRequest>[0], options: Parameters<IRequest>[1]): Promise<Scrapper> {
    try {
      const response = await this.client(uri, options);
      this.response = response.ok ? response.value : undefined;

      return this;
    } catch (error) {
      console.error(error);
      return this;
    }
  }

  public decode = (from: 'iso-8859-1' | string): Scrapper => {
    if (typeof this.response === typeof Buffer.from('')) {
      this.response = new TextDecoder(from).decode(this.response as Buffer);
    }
    return this;
  };

  public decodeAndClean = (from: 'iso-8859-1' | string): Scrapper => {
    const { response } = this.decode(from);
    if (typeof response === 'string') this.response = response.replaceAll(/(\r\n|\n|\r)/gm, ' '); // convert '\n','\r','\r\n' text to " "
    return this;
  };

  public querySelectorAll<T>(selector: string): null | Element[] {
    if (typeof selector !== 'string') {
      throw new Error('Scrapper - querySelectorAll param must a valid selector');
    }
    try {
      if (!this.response) return null;
      const { document } = this.getWindow();

      return Array.from(document.querySelectorAll(selector));
    } catch (err) {
      return null;
    }
  }

  public querySelector(selector: string): null | Element {
    if (typeof selector !== 'string') {
      throw new Error('Scrapper - querySelector param must a valid selector');
    }
    try {
      if (!this.response) return null;
      const { document } = this.getWindow();
      return document.querySelector(selector);
    } catch (err) {
      return null;
    }
  }

  private getWindow = () => parseHTML(this.response);
}
