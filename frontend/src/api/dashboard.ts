import client from './client';
import type { DashboardData } from '@/types';

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await client.get('/dashboard');
  return res.data;
}
