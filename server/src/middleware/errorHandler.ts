import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  void _next;
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Unknown error';
  if (statusCode === 500) {
    console.error('Error:', err.message);
  }
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
