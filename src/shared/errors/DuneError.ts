
export class DuneError extends Error {

  constructor(errorMessage: string, replacers?: string[], cause?: Error, options?: { fileName: string, lineNumber: number, loggable: boolean }) {
    const superOptions = cause ? { cause } : undefined;
    if (replacers?.length) {
      for (let i = 0; i < replacers.length; i++) errorMessage = errorMessage.replace(`%${i}`, replacers[i]);
    }
    super(errorMessage, superOptions);
    if (options) {
      this.loggable = options.loggable;
      this.fileName = options.fileName;
      this.lineNumber = options.lineNumber;
    }
  }

  loggable = true;
  fileName = '';
  lineNumber = 0;

}