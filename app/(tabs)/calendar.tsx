import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Calendar from 'expo-calendar';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import {
  formatDateStamp,
  toDateStamp,
  useStudyData,
} from '@/context/StudyData';
import {
  ActionButton,
  IconButton,
  LoadingState,
  Page,
  PageHeading,
  Pill,
  SectionHeading,
  Surface,
} from '@/components/study-ui';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const timeOptions = ['10:00 AM', '3:00 PM', '5:00 PM'];

function dateFromParts(year: number, month: number, day: number) {
  return new Date(year, month, day);
}

function makeMonthCells(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  return [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function eventStart(dateStamp: string, timeLabel: string) {
  const [year, month, day] = dateStamp.split('-').map(Number);
  const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
  const date = new Date(year, month - 1, day);
  if (match) {
    let hour = Number(match[1]) % 12;
    if (match[3] === 'PM') hour += 12;
    date.setHours(hour, Number(match[2]), 0, 0);
  }
  return date;
}

export default function CalendarScreen() {
  const colors = useColors();
  const { data, ready, addSession, markCalendarSynced } = useStudyData();
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => toDateStamp(new Date()));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTime, setSelectedTime] = useState(timeOptions[1]);
  const [syncing, setSyncing] = useState(false);

  const cells = useMemo(() => makeMonthCells(visibleMonth), [visibleMonth]);
  const sessionsForDay = data.sessions.filter(
    (session) => session.date === selectedDate,
  );
  const eventDates = new Set(data.sessions.map((session) => session.date));
  const monthTitle = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const unsyncedCount = data.sessions.filter((session) => !session.calendarEventId).length;

  if (!ready) return <LoadingState />;

  const changeMonth = (delta: number) => {
    const next = dateFromParts(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + delta,
      1,
    );
    setVisibleMonth(next);
    setSelectedDate(toDateStamp(next));
  };

  const openScheduler = () => {
    setSelectedCourse(data.profile.courses[0] ?? '');
    setSelectedTime(timeOptions[1]);
    setScheduleOpen(true);
  };

  const saveSession = () => {
    if (!selectedCourse) {
      Alert.alert('Add a course first', 'Set up a course in your profile before scheduling a session.');
      return;
    }
    addSession({
      course: selectedCourse,
      date: selectedDate,
      time: selectedTime,
      place: 'Group Study Room 201',
      topic: `${selectedCourse} study session`,
    });
    setScheduleOpen(false);
    Alert.alert(
      'Session added',
      `${selectedCourse} is on your calendar for ${formatDateStamp(selectedDate)} at ${selectedTime}.`,
    );
  };

  const syncToDeviceCalendar = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Use the mobile app', 'Calendar sync is available in Expo Go on your iPhone or Android device.');
      return;
    }
    const unsynced = data.sessions.filter((session) => !session.calendarEventId);
    if (!unsynced.length) {
      Alert.alert('Already in sync', 'All your study sessions have been added to your device calendar.');
      return;
    }
    setSyncing(true);
    try {
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Calendar access is off',
          'Allow calendar access in your device settings to add study sessions.',
        );
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const writableCalendar = calendars.find(
        (calendar) => calendar.allowsModifications,
      );
      if (!writableCalendar) {
        Alert.alert(
          'No writable calendar found',
          'Add a calendar on your device, then try syncing again.',
        );
        return;
      }
      for (const session of unsynced) {
        const startDate = eventStart(session.date, session.time);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        const eventId = await Calendar.createEventAsync(writableCalendar.id, {
          title: `${session.course} · Study Buddy`,
          startDate,
          endDate,
          location: session.place,
          notes: session.topic,
          alarms: [{ relativeOffset: -15 }],
        });
        markCalendarSynced(session.id, eventId);
      }
      Alert.alert(
        'Calendar updated',
        `${unsynced.length} ${unsynced.length === 1 ? 'session was' : 'sessions were'} added to ${writableCalendar.title}.`,
      );
    } catch {
      Alert.alert(
        'Could not sync right now',
        'Check your calendar permissions and try again.',
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <Page>
        <PageHeading
          eyebrow="Keep it moving"
          title="Your study\nrhythm."
          subtitle="Plan a session, keep your week in view."
        />

        <Surface style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <View>
              <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                {monthTitle}
              </Text>
              <Text style={[styles.monthHint, { color: colors.mutedForeground }]}>
                Tap a day to see what is planned
              </Text>
            </View>
            <View style={styles.monthActions}>
              <IconButton
                icon="chevron-left"
                label="Previous month"
                onPress={() => changeMonth(-1)}
              />
              <IconButton
                icon="chevron-right"
                label="Next month"
                onPress={() => changeMonth(1)}
              />
            </View>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={[styles.weekLabel, { color: colors.mutedForeground }]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.dayGrid}>
            {cells.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              const dateStamp = toDateStamp(
                dateFromParts(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
              );
              const selected = selectedDate === dateStamp;
              const hasEvent = eventDates.has(dateStamp);
              const isToday = toDateStamp(new Date()) === dateStamp;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${dateStamp}${hasEvent ? ', study session' : ''}`}
                  key={dateStamp}
                  onPress={() => setSelectedDate(dateStamp)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayNumber,
                      selected && { backgroundColor: colors.primary },
                      !selected && isToday && { borderColor: colors.primary, borderWidth: 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: selected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: hasEvent ? colors.primary : 'transparent' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
        </Surface>

        <View style={styles.scheduleHeading}>
          <SectionHeading title={formatDateStamp(selectedDate)} />
          <Text style={[styles.scheduleCount, { color: colors.mutedForeground }]}>
            {sessionsForDay.length
              ? `${sessionsForDay.length} session${sessionsForDay.length === 1 ? '' : 's'}`
              : 'Open day'}
          </Text>
        </View>

        {sessionsForDay.length ? (
          sessionsForDay.map((session) => (
            <Surface key={session.id} style={styles.sessionCard}>
              <View style={[styles.sessionRail, { backgroundColor: colors.accent }]} />
              <View style={styles.sessionInfo}>
                <View style={styles.sessionTopLine}>
                  <Text style={[styles.sessionCourse, { color: colors.foreground }]}>
                    {session.course}
                  </Text>
                  {session.calendarEventId ? (
                    <View style={styles.syncedTag}>
                      <Feather name="check" size={11} color={colors.primary} />
                      <Text style={[styles.syncedText, { color: colors.primary }]}>Synced</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.sessionTopic, { color: colors.mutedForeground }]}>
                  {session.topic}
                </Text>
                <View style={styles.sessionMeta}>
                  <Feather name="clock" size={13} color={colors.primary} />
                  <Text style={[styles.sessionMetaText, { color: colors.foreground }]}>
                    {session.time}
                  </Text>
                  <Feather name="map-pin" size={13} color={colors.primary} />
                  <Text style={[styles.sessionMetaText, { color: colors.foreground }]} numberOfLines={1}>
                    {session.place}
                  </Text>
                </View>
              </View>
            </Surface>
          ))
        ) : (
          <Surface style={styles.emptyCard}>
            <Feather name="sun" size={20} color={colors.primary} />
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Leave room for a good session
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Pick a course and time to make a plan.
              </Text>
            </View>
          </Surface>
        )}

        <ActionButton
          label="Schedule a study session"
          icon="plus"
          onPress={openScheduler}
        />

        <Surface style={styles.syncCard}>
          <View style={[styles.syncIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          </View>
          <View style={styles.syncCopy}>
            <Text style={[styles.syncTitle, { color: colors.foreground }]}>
              Your calendar, together
            </Text>
            <Text style={[styles.syncText, { color: colors.mutedForeground }]}>
              Add planned sessions to your device calendar.
            </Text>
          </View>
          <ActionButton
            label={syncing ? 'Syncing' : unsyncedCount ? 'Sync' : 'Synced'}
            icon={unsyncedCount ? 'refresh-cw' : 'check'}
            tone="soft"
            compact
            disabled={syncing}
            onPress={syncToDeviceCalendar}
          />
        </Surface>
      </Page>

      <Modal
        visible={scheduleOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setScheduleOpen(false)}
            accessibilityLabel="Close session planner"
          />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeading}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Make a study plan
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  {formatDateStamp(selectedDate)}
                </Text>
              </View>
              <IconButton
                icon="x"
                label="Close"
                onPress={() => setScheduleOpen(false)}
              />
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              COURSE
            </Text>
            <View style={styles.optionRow}>
              {data.profile.courses.map((course) => (
                <Pill
                  key={course}
                  label={course}
                  active={selectedCourse === course}
                  onPress={() => setSelectedCourse(course)}
                />
              ))}
              {!data.profile.courses.length ? (
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  Add courses in your profile first.
                </Text>
              ) : null}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              TIME
            </Text>
            <View style={styles.optionRow}>
              {timeOptions.map((time) => (
                <Pill
                  key={time}
                  label={time}
                  active={selectedTime === time}
                  onPress={() => setSelectedTime(time)}
                />
              ))}
            </View>
            <ActionButton
              label="Add to my calendar"
              icon="check"
              onPress={saveSession}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    gap: 17,
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  monthHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 4,
  },
  monthActions: {
    flexDirection: 'row',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumber: {
    width: 31,
    height: 31,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 3,
  },
  scheduleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  scheduleCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  sessionCard: {
    flexDirection: 'row',
    padding: 15,
    gap: 13,
  },
  sessionRail: {
    width: 4,
    borderRadius: 3,
  },
  sessionInfo: {
    flex: 1,
    gap: 6,
  },
  sessionTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sessionCourse: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  syncedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  sessionTopic: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  sessionMetaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    flexShrink: 1,
    marginRight: 5,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    minHeight: 88,
  },
  emptyCopy: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
  },
  syncIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCopy: {
    flex: 1,
    gap: 4,
  },
  syncTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  syncText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,31,25,0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 17,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 3,
  },
  sheetHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.3,
    marginBottom: -8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
