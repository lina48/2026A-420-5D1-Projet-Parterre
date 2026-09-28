import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type User = { id: number; nom: string; courriel: string; role: 'spectateur' | 'gestionnaire' };
export type AuthRequest = Request & { user?: User };

const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response.status(401).json({ error: 'Connectez-vous pour continuer.' });
  try {
    request.user = jwt.verify(token, secret) as User;
    next();
  } catch {
    response.status(401).json({ error: 'Votre session a expiré. Reconnectez-vous.' });
  }
}

export function requireManager(request: AuthRequest, response: Response, next: NextFunction) {
  if (request.user?.role !== 'gestionnaire') return response.status(403).json({ error: 'Accès réservé au personnel.' });
  next();
}

export function asyncRoute(handler: (request: AuthRequest, response: Response) => Promise<unknown>) {
  return (request: AuthRequest, response: Response, next: NextFunction) => handler(request, response).catch(next);
}