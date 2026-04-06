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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { addSession, addSubject, getSessions, getSubjects, StudySession } from '@/utils/storage';
import { formatDuration, generateId, getTodayDate } from '@/utils/helpers';

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
      await addSession(session);
      await addSubject(trimmed);
      setRecentSubjects((prev) =>
        [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, 20)
      );
      setElapsedSeconds(0);
      setSubject('');
      await checkMilestone();
    } catch (e) {
      Alert.alert('Save failed', String(e));
    }
  }

  async function checkMilestone() {
    const today = getTodayDate();
    const sessions = await getSessions();
    const todayTotal = sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.durationSeconds, 0);

    if (todayTotal >= MILESTONE_THRESHOLD) {
      const hours = (todayTotal / 3600).toFixed(1);
      setMilestoneMessage(
        `You've studied ${hours} hours today! Keep it up!`
      );
    }
  }

  const filteredRecents = recentSubjects.filter(
    (s) => subject.trim() === '' || s.toLowerCase().includes(subject.toLowerCase())
  );

  const ringBorder = isRunning
    ? colors.tint
    : isDark
      ? '#2a2d30'
      : '#e8e8e8';

  const ringBg = isRunning
    ? (isDark ? colors.tint + '10' : colors.tint + '08')
    : 'transparent';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Study Timer</ThemedText>
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
                    borderColor: isDark ? '#333' : '#e0e0e0',
                    backgroundColor: isDark ? '#1c1e20' : '#f7f7f8',
                  },
                ]}
                placeholder="What are you studying?"
                placeholderTextColor={colors.icon}
                value={subject}
                onChangeText={setSubject}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
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
                      style={[
                        styles.chip,
                        { backgroundColor: isDark ? '#1c1e20' : '#f0f0f2' },
                      ]}
                      onPress={() => setSubject(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, { color: textColor }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.tint + '15' }]}>
              <View style={[styles.badgeDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.badgeText, { color: colors.tint }]}>
                {subject.trim()}
              </Text>
            </View>
          )}
        </View>

        {/* Timer ring — this is the hero */}
        <View style={styles.timerArea}>
          <View
            style={[
              styles.timerRing,
              { borderColor: ringBorder, backgroundColor: ringBg },
            ]}
          >
            <Text
              style={[
                styles.timerText,
                { color: isRunning ? colors.tint : textColor },
              ]}
            >
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>
          {!isRunning && elapsedSeconds === 0 && (
            <Text style={[styles.hint, { color: colors.icon }]}>
              {subject.trim() ? 'Ready when you are' : 'Pick a subject to begin'}
            </Text>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomArea}>
          {milestoneMessage && (
            <View style={[styles.milestone, { backgroundColor: isDark ? '#0d2618' : '#eafaf1' }]}>
              <Text style={styles.milestoneEmoji}>&#127881;</Text>
              <Text style={[styles.milestoneText, { color: '#27ae60' }]}>
                {milestoneMessage}
              </Text>
            </View>
          )}

          <Pressable
            onPress={isRunning ? handleStop : handleStart}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: isRunning ? '#e74c3c' : colors.tint,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
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
    paddingTop: 8,
    paddingBottom: 4,
  },

  subjectArea: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
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
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
});
