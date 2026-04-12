import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, nickname, password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      
      const user = await authService.register(username, nickname, password);
      const token = authService.generateToken(user);
      res.json({ user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const { user, token } = await authService.login(username, password);
      res.json({ user: { id: user.id, username: user.username, nickname: user.nickname, role: user.role }, token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: user.id, email: user.email, phone: user.phone, nickname: user.nickname, role: user.role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createGuest(req: Request, res: Response) {
    try {
      const user = await authService.createGuestUser();
      const token = authService.generateToken(user);
      res.json({ user: { id: user.id, nickname: user.nickname, role: user.role }, token });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
