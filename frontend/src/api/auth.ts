import client from './client';
import type { User } from '@/types';

export async function loginApi(
  username: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}
