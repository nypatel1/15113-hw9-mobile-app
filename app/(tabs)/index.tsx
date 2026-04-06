import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { addSession, addSubject, getSessions, getSubjects, StudySession } from '@/utils/storage';
import { formatDuration, generateId, getTodayDate, withAlpha } from '@/utils/helpers';

const MIN_SESSION_SECONDS = 10;
const MILESTONE_THRESHOLD = 3600;

export default function TimerScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const textColor = useThemeColor({}, 'text');
  const isDark = colorScheme === 'dark';

  const [subject, setSubject] = useState('');
  const [recentSubjects, setRecentSubjects] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSubjects().then(setRecentSubjects);
    }, [])
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleStart() {
    const trimmed = subject.trim();
    if (!trimmed) {
      Alert.alert('Subject required', 'Please enter a subject before starting.');
      return;
    }
    Keyboard.dismiss();
    setMilestoneMessage(null);
    startTimeRef.current = new Date();
    setElapsedSeconds(0);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const diff = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
        setElapsedSeconds(diff);
      }
    }, 1000);
  }

  async function handleStop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);

    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      : elapsedSeconds;

    if (duration < MIN_SESSION_SECONDS) {
      setElapsedSeconds(0);
      Alert.alert('Session too short', 'Sessions under 10 seconds are discarded.');
      return;
    }

    const trimmed = subject.trim();
    const session: StudySession = {
      id: generateId(),
      subject: trimmed,
      startTime: startTimeRef.current?.toISOString() ?? new Date().toISOString(),
      durationSeconds: duration,
      date: getTodayDate(),
    };

    try {
      const today = getTodayDate();
      const existing = await getSessions();
      const preSaveTotal = existing
        .filter((s) => s.date === today)
        .reduce((sum, s) => sum + s.durationSeconds, 0);

      await addSession(session);
      await addSubject(trimmed);
      setRecentSubjects((prev) =>
        [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 20)
      );
      setElapsedSeconds(0);
      setSubject('');

      const postSaveTotal = preSaveTotal + duration;
      if (preSaveTotal < MILESTONE_THRESHOLD && postSaveTotal >= MILESTONE_THRESHOLD) {
        const hours = (postSaveTotal / 3600).toFixed(1);
        setMilestoneMessage(
          `You've studied ${hours} hours today! Keep it up!`
        );
      }
    } catch (e) {
      Alert.alert('Save failed', String(e));
    }
  }

  const filteredRecents = recentSubjects.filter(
    (s) => subject.trim() === '' || s.toLowerCase().includes(subject.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Study Timer</ThemedText>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Focus on what matters
          </Text>
        </View>

        {/* Subject area */}
        <View style={styles.subjectArea}>
          {!isRunning ? (
            <>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="What are you studying?"
                placeholderTextColor={colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                accessibilityLabel="Subject name"
                accessibilityHint="Enter the subject you want to study"
              />
              {filteredRecents.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.chipsScroll}
                  contentContainerStyle={styles.chipsRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredRecents.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, { backgroundColor: colors.surface }]}
                      onPress={() => setSubject(s)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Select ${s}`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.chipText, { color: textColor }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View
              style={[
                styles.badge,
                { backgroundColor: withAlpha(colors.tint, 0.12) },
              ]}
            >
              <View style={[styles.badgeDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.badgeText, { color: colors.tint }]}>
                {subject.trim()}
              </Text>
            </View>
          )}
        </View>

        {/* Timer ring */}
        <View style={styles.timerArea}>
          <View
            style={[
              styles.timerRing,
              {
                borderColor: isRunning ? colors.tint : colors.border,
                backgroundColor: isRunning
                  ? withAlpha(colors.tint, 0.06)
                  : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.timerText,
                { color: isRunning ? colors.tint : textColor },
              ]}
              accessibilityLabel={`Elapsed time: ${formatDuration(elapsedSeconds)}`}
              accessibilityRole="timer"
            >
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>
          {!isRunning && elapsedSeconds === 0 && (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {subject.trim() ? 'Ready when you are' : 'Pick a subject to begin'}
            </Text>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomArea}>
          {milestoneMessage && (
            <View
              style={[
                styles.milestone,
                { backgroundColor: withAlpha(Palette.green, isDark ? 0.15 : 0.1) },
              ]}
            >
              <Text style={styles.milestoneEmoji}>&#127881;</Text>
              <Text style={[styles.milestoneText, { color: Palette.green }]}>
                {milestoneMessage}
              </Text>
            </View>
          )}

          <Pressable
            onPress={isRunning ? handleStop : handleStart}
            accessibilityLabel={isRunning ? 'Stop study session' : 'Start study session'}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isRunning ? Palette.red : colors.tint,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
              !isDark && styles.buttonShadow,
            ]}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Stop Session' : 'Start Session'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 2,
  },
  headerSub: {
    fontSize: 15,
    marginTop: 4,
  },

  subjectArea: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  chipsScroll: {
    marginTop: 12,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
  },

  timerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    lineHeight: 64,
  },
  hint: {
    marginTop: 20,
    fontSize: 15,
  },

  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  milestoneEmoji: {
    fontSize: 20,
  },
  milestoneText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
});
