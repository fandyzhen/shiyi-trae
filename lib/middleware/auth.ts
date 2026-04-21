import { verifyToken } from '../services/auth.service';
import { getDataSource } from '../config/database';
import { User } from '../entities/User';

export interface AuthContext {
  user?: {
    userId: string;
    role: string;
  };
}

export async function verifyAuth(headers: Headers): Promise<AuthContext> {
  const authHeader = headers.get('authorization');
  
  if (!authHeader) {
    return {};
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return {};
  }

  try {
    const decoded = verifyToken(token);
    return { user: decoded };
  } catch (error) {
    return {};
  }
}

export async function requireAuth(headers: Headers): Promise<{ userId: string; role: string }> {
  const auth = await verifyAuth(headers);
  if (!auth.user) {
    throw new Error('Unauthorized');
  }
  return auth.user;
}

export async function verifyAdmin(headers: Headers): Promise<void> {
  const { userId } = await requireAuth(headers);
  const dataSource = await getDataSource();
  const userRepository = dataSource.getRepository(User);
  
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
}
