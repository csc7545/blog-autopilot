export class PipelineError extends Error {
  constructor(
    message: string,
    public step: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'PipelineError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
