import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDataSource } from '../config/database';
import { User } from '../entities/User';

export async function register(username: string, password: string): Promise<User> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  
  if (!username) {
    throw new Error('Username is required');
  }

  const existingUser = await userRepository.findOne({
    where: { username }
  });

  if (existingUser) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = userRepository.create({
    username,
    nickname: username,
    password: hashedPassword,
    role: 'registered',
    registeredUsesRemaining: 10,
    hasUsedFreeTrial: false
  });

  return await userRepository.save(user);
}

export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  
  if (!username) {
    throw new Error('Username is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }

  const user = await userRepository.findOne({
    where: { username }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isValidPassword = await bcrypt.compare(password, user.password || '');
  if (!isValidPassword) {
    throw new Error('Invalid password');
  }

  const token = generateToken(user);
  return { user, token };
}

export function generateToken(user: User): string {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    { userId: user.id, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { userId: string; role: string } {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, jwtSecret) as { userId: string; role: string };
}

export async function getUserById(userId: string): Promise<User | null> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  return await userRepository.findOne({ where: { id: userId } });
}

export async function createGuestUser(): Promise<User> {
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  const user = userRepository.create({
    nickname: '访客用户',
    role: 'guest',
    freeUsesRemaining: 1,
    hasUsedFreeTrial: false
  });
  return await userRepository.save(user);
}
