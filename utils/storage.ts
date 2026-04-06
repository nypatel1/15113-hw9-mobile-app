import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'study_sessions';
const SUBJECTS_KEY = 'subject_list';

export interface StudySession {
  id: string;
  subject: string;
  startTime: string;
  durationSeconds: number;
  date: string;
}

export async function getSessions(): Promise<StudySession[]> {
  const data = await AsyncStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveSessions(sessions: StudySession[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function addSession(session: StudySession): Promise<void> {
  const sessions = await getSessions();
  sessions.unshift(session);
  await saveSessions(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getSessions();
  await saveSessions(sessions.filter((s) => s.id !== id));
}

export async function getSubjects(): Promise<string[]> {
  const data = await AsyncStorage.getItem(SUBJECTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function addSubject(subject: string): Promise<void> {
  const subjects = await getSubjects();
  const filtered = subjects.filter((s) => s !== subject);
  filtered.unshift(subject);
  await AsyncStorage.setItem(SUBJECTS_KEY, JSON.stringify(filtered.slice(0, 20)));
}
