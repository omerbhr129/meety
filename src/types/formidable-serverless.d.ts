declare module 'formidable-serverless' {
  import { IncomingMessage } from 'http';

  interface Fields {
    [key: string]: string | string[];
  }

  interface File {
    path: string;
    type?: string;
    name?: string;
  }

  interface Files {
    [key: string]: File;
  }

  interface IncomingForm {
    parse(
      req: IncomingMessage,
      callback: (err: Error | null, fields: Fields, files: Files) => void
    ): void;
  }

  class FormidableServerless {
    static IncomingForm: {
      new (): IncomingForm;
    };
  }

  export = FormidableServerless;
}
