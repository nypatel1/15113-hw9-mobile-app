import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { deleteSession, getSessions, StudySession } from '@/utils/storage';
import {
  formatDateLabel,
  formatDuration,
  isWithinLastSevenDays,
  withAlpha,
} from '@/utils/helpers';

interface SectionData {
  title: string;
  data: StudySession[];
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const textColor = useThemeColor({}, 'text');
  const isDark = colorScheme === 'dark';

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      Alert.alert('Load failed', 'Could not load sessions from storage.');
    }
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
            try {
              await deleteSession(session.id);
              await loadSessions();
            } catch {
              Alert.alert('Delete failed', 'Could not delete the session.');
            }
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
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
  for (const date of sortedDates) {
    sections.push({ title: formatDateLabel(date), data: dateMap.get(date)! });
  }

  const subjectTotals = new Map<string, number>();
  let weeklyTotal = 0;
  for (const s of sessions) {
    if (isWithinLastSevenDays(s.date)) {
      subjectTotals.set(s.subject, (subjectTotals.get(s.subject) ?? 0) + s.durationSeconds);
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
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            <ThemedText type="title" style={styles.screenTitle}>
              History
            </ThemedText>
            <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
              Your study sessions at a glance
            </Text>

            {hasData && (
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  LAST 7 DAYS
                </Text>
                <Text style={[styles.weeklyTotal, { color: colors.tint }]}>
                  {formatDuration(weeklyTotal)}
                </Text>

                {subjectTotals.size > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}

                <View style={styles.subjectList}>
                  {Array.from(subjectTotals.entries()).map(([subj, total]) => (
                    <View key={subj} style={styles.subjectRow}>
                      <View
                        style={[
                          styles.subjectDot,
                          { backgroundColor: colors.tint },
                        ]}
                      />
                      <Text
                        style={[styles.subjectName, { color: textColor }]}
                        numberOfLines={1}
                      >
                        {subj}
                      </Text>
                      <Text style={[styles.subjectTime, { color: colors.tint }]}>
                        {formatDuration(total)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {hasData && (
              <Text style={[styles.sessionsHeading, { color: textColor }]}>
                All Sessions
              </Text>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleLongPress(item)}
            accessibilityLabel={`${item.subject}, ${formatDuration(item.durationSeconds)}. Long press to delete`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.sessionRow,
              {
                backgroundColor: pressed
                  ? withAlpha(colors.tint, 0.08)
                  : colors.surface,
                borderColor: pressed ? colors.tint : colors.border,
              },
            ]}
          >
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionSubject, { color: textColor }]}>
                {item.subject}
              </Text>
              <Text style={[styles.sessionTime, { color: colors.textSecondary }]}>
                {new Date(item.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <Text style={[styles.sessionDuration, { color: colors.tint }]}>
              {formatDuration(item.durationSeconds)}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              No study sessions yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start a timer on the Timer tab to begin tracking!
            </Text>
          </View>
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
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 15,
    marginBottom: 24,
  },

  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  weeklyTotal: {
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    lineHeight: 44,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  subjectList: {
    gap: 10,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  sectionHeader: {
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
  },
  sessionTime: {
    fontSize: 13,
    marginTop: 2,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
    textAlign: 'center',
  },
});
