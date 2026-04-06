export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateLabel(dateStr: string): string {
  const today = getTodayDate();
  if (dateStr === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isWithinLastSevenDays(dateStr: string): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d >= start;
}
