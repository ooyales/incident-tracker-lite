import client from './client';
import type { Problem } from '@/types';

export async function fetchProblems(params?: Record<string, string>): Promise<Problem[]> {
  const res = await client.get('/problems', { params });
  const d = res.data;
  return Array.isArray(d) ? d : d.problems || [];
}

export async function fetchProblem(id: string): Promise<Problem> {
  const res = await client.get(`/problems/${id}`);
  return res.data;
}
