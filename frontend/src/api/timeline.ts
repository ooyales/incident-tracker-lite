import client from './client';
import type { TimelineEntry } from '@/types';

export async function fetchTimeline(incidentId: string): Promise<TimelineEntry[]> {
  const res = await client.get(`/incidents/${incidentId}/timeline`);
  return res.data;
}

export async function addTimelineEntry(
  incidentId: string,
  data: { entry_type: string; content: string; author?: string }
): Promise<TimelineEntry> {
  const res = await client.post(`/incidents/${incidentId}/timeline`, data);
  return res.data;
}
