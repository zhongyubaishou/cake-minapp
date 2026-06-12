import jwt from 'jsonwebtoken';
import { config } from '../config';

export function generateUserToken(userId: number): string {
  return jwt.sign({ userId, type: 'user' }, config.jwtSecret, { expiresIn: '30d' });
}

export function generateAdminToken(adminId: number): string {
  return jwt.sign({ adminId, type: 'admin' }, config.jwtSecret, { expiresIn: '8h' });
}
