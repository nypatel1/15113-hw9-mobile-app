import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, SectionList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteSession, getSessions, StudySession } from '@/utils/storage';
import { formatDateLabel, formatDuration, isWithinLastSevenDays } from '@/utils/helpers';

interface SectionData {
  title: string;
  data: StudySession[];
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    const data = await getSessions();
    setSessions(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }

  function handleLongPress(session: StudySession) {
    Alert.alert(
      'Delete Session',
      `Delete ${session.subject} (${formatDuration(session.durationSeconds)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(session.id);
            await loadSessions();
          },
        },
      ]
    );
  }

  const sections: SectionData[] = [];
  const dateMap = new Map<string, StudySession[]>();
  for (const s of sessions) {
    const list = dateMap.get(s.date);
    if (list) {
      list.push(s);
    } else {
      dateMap.set(s.date, [s]);
    }
  }
  for (const [date, data] of dateMap) {
    sections.push({ title: formatDateLabel(date), data });
  }

  const subjectTotals = new Map<string, number>();
  let weeklyTotal = 0;
  for (const s of sessions) {
    subjectTotals.set(s.subject, (subjectTotals.get(s.subject) ?? 0) + s.durationSeconds);
    if (isWithinLastSevenDays(s.date)) {
      weeklyTotal += s.durationSeconds;
    }
  }

  const hasData = sessions.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <ThemedView>
            <ThemedText type="title" style={styles.screenTitle}>
              History
            </ThemedText>

            {hasData && (
              <ThemedView style={styles.summaryCard}>
                <ThemedText type="subtitle" style={styles.summaryTitle}>
                  Weekly Summary (Last 7 Days)
                </ThemedText>
                <ThemedText style={[styles.weeklyTotal, { color: colors.tint }]}>
                  {formatDuration(weeklyTotal)}
                </ThemedText>

                <ThemedView style={styles.subjectList}>
                  {Array.from(subjectTotals.entries()).map(([subj, total]) => (
                    <ThemedView key={subj} style={styles.subjectRow}>
                      <ThemedText style={styles.subjectName} numberOfLines={1}>
                        {subj}
                      </ThemedText>
                      <ThemedText style={[styles.subjectTime, { color: colors.tint }]}>
                        {formatDuration(total)}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {hasData && (
              <ThemedText type="subtitle" style={styles.sessionsHeading}>
                All Sessions
              </ThemedText>
            )}
          </ThemedView>
        }
        renderSectionHeader={({ section }) => (
          <ThemedView
            style={[
              styles.sectionHeader,
              { backgroundColor: colorScheme === 'dark' ? '#1a1c1e' : '#f0f0f0' },
            ]}
          >
            <ThemedText style={styles.sectionHeaderText}>{section.title}</ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleLongPress(item)}
            style={({ pressed }) => [
              styles.sessionRow,
              {
                backgroundColor: pressed
                  ? colorScheme === 'dark'
                    ? '#2a2c2e'
                    : '#eaeaea'
                  : 'transparent',
              },
            ]}
          >
            <ThemedView style={styles.sessionInfo}>
              <ThemedText style={styles.sessionSubject}>{item.subject}</ThemedText>
              <ThemedText style={styles.sessionTime}>
                {new Date(item.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </ThemedText>
            </ThemedView>
            <ThemedText style={[styles.sessionDuration, { color: colors.tint }]}>
              {formatDuration(item.durationSeconds)}
            </ThemedText>
          </Pressable>
        )}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No study sessions yet.</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Start a timer on the Timer tab to begin tracking!
            </ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  screenTitle: {
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  weeklyTotal: {
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  subjectList: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  subjectTime: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sessionsHeading: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
});
