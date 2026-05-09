export class UserFacingError extends Error {
  code: string;
  what: string;
  why: string;
  nextStep: string;

  constructor(code: string, what: string, why: string, nextStep: string) {
    super(`${what} ${why} ${nextStep}`.trim());
    this.code = code;
    this.what = what;
    this.why = why;
    this.nextStep = nextStep;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof UserFacingError) {
    return `${error.what} ${error.why} ${error.nextStep}`.trim();
  }

  if (error instanceof DOMException && error.name === 'EncodingError') {
    return 'The audio decode failed. The file may be damaged, truncated, or encoded in an unsupported way. Try a fresh WAV export from your editor.';
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'The app hit an unexpected error. Import the file again or refresh the page and retry.';
}
