declare namespace Express {
  interface Request {
    userId?: number;
    validatedQuery?: Record<string, unknown>;
  }
}
