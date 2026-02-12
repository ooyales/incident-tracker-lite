import client from './client';
import type { Incident } from '@/types';

export async function fetchIncidents(params?: Record<string, string>): Promise<Incident[]> {
  const res = await client.get('/incidents', { params });
  const d = res.data;
  return Array.isArray(d) ? d : d.incidents || [];
}

export async function fetchIncident(id: string): Promise<Incident> {
  const res = await client.get(`/incidents/${id}`);
  return res.data;
}

export async function createIncident(data: Partial<Incident>): Promise<Incident> {
  const res = await client.post('/incidents', data);
  return res.data;
}

export async function updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
  const res = await client.put(`/incidents/${id}`, data);
  return res.data;
}

export async function updateIncidentStatus(id: string, status: string): Promise<Incident> {
  const res = await client.patch(`/incidents/${id}/status`, { status });
  return res.data;
}
