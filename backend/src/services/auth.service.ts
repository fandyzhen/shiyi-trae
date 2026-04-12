import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppDataSource } from '../config/database';

export class AuthService {
  private userRepository: Repository<User>;
  private jwtSecret: string;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  async register(username: string, password: string): Promise<User> {
    if (!username) {
      throw new Error('Username is required');
    }

    const existingUser = await this.userRepository.findOne({
      where: { username }
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      nickname: username,
      password: hashedPassword,
      role: 'registered',
      registeredUsesRemaining: 10,
      hasUsedFreeTrial: false
    });

    return await this.userRepository.save(user);
  }

  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    if (!username) {
      throw new Error('Username is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }

    const user = await this.userRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '');
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, role: user.role },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { userId: string; role: string } {
    return jwt.verify(token, this.jwtSecret) as { userId: string; role: string };
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id: userId } });
  }

  async createGuestUser(): Promise<User> {
    const user = this.userRepository.create({
      nickname: '访客用户',
      role: 'guest',
      freeUsesRemaining: 1,
      hasUsedFreeTrial: false
    });
    return await this.userRepository.save(user);
  }
}
