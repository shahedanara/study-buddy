import React, { useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import * as Calendar from 'expo-calendar';
import { useColors } from '@/hooks/useColors';
import {
  formatDateStamp,
  studyBuddies,
  toDateStamp,
  useStudyData,
} from '@/context/StudyData';
import {
  ActionButton,
  LoadingState,
  Page,
  PageHeading,
  PersonAvatar,
  Pill,
  SectionHeading,
  Surface,
} from '@/components/study-ui';

const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function courseKey(course: string) {
  return course.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function MatchesScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    data,
    ready,
    toggleConnection,
    addSession,
    markCalendarSynced,
  } = useStudyData();
  const [courseFilter, setCourseFilter] = useState('All');

  const matches = useMemo(() => {
    return studyBuddies
      .map((buddy) => {
        const commonCourses = buddy.courses.filter((course) =>
          data.profile.courses.some(
            (profileCourse) => courseKey(profileCourse) === courseKey(course),
          ),
        );
        const commonDays = buddy.availability.filter((day) =>
          data.profile.availability.includes(day),
        );
        const commonStudyTimes = buddy.studyTimes.filter((time) =>
          data.profile.studyTimes.includes(time),
        );
        const supportCourses = buddy.strengths.filter((course) =>
          data.profile.focusCourses.some(
            (focusCourse) => courseKey(focusCourse) === courseKey(course),
          ),
        );
        const courseScore =
          data.profile.courses.length > 0
            ? commonCourses.length / data.profile.courses.length
            : 0;
        const timeScore = commonStudyTimes.length > 0 ? 1 : 0;
        const supportScore =
          data.profile.focusCourses.length > 0
            ? supportCourses.length / data.profile.focusCourses.length
            : 0;
        const compatibility = Math.min(
          99,
          Math.round(40 + courseScore * 20 + timeScore * 15 + supportScore * 25),
        );
        return {
          ...buddy,
          commonCourses,
          commonDays,
          commonStudyTimes,
          supportCourses,
          compatibility,
        };
      })
      .filter((match) => {
        if (!match.commonCourses.length) return false;
        if (!match.commonDays.length || !match.commonStudyTimes.length) return false;
        if (courseFilter === 'All') return true;
        return match.commonCourses.some(
          (course) => courseKey(course) === courseKey(courseFilter),
        );
      })
      .sort((a, b) => b.compatibility - a.compatibility);
  }, [
    data.profile.availability,
    data.profile.courses,
    data.profile.focusCourses,
    data.profile.studyTimes,
    courseFilter,
  ]);

  if (!ready) return <LoadingState />;

  const planMeetup = async (match: (typeof matches)[number]) => {
    const weekdayNumber: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const date = new Date();
    const nextSlot = match.commonDays
      .map((day) => ({
        day,
        daysAhead: (weekdayNumber[day] - date.getDay() + 7) % 7 || 7,
      }))
      .sort((a, b) => a.daysAhead - b.daysAhead)[0];
    if (!nextSlot || !match.commonStudyTimes.length) {
      Alert.alert('No shared time found', 'Update your availability to plan a meetup.');
      return;
    }

    date.setDate(date.getDate() + nextSlot.daysAhead);
    const studyTime = match.commonStudyTimes[0];
    const time =
      studyTime === 'Morning'
        ? '10:00 AM'
        : studyTime === 'Evening'
          ? '5:00 PM'
          : '3:00 PM';
    const course = match.supportCourses[0] ?? match.commonCourses[0];
    const preference = `${data.profile.preference} ${match.preference}`.toLowerCase();
    const place = preference.includes('quiet')
      ? 'Quiet Corner Pods'
      : 'Group Study Room 201';
    const topic =
      data.profile.focusTopics.trim() ||
      `Review ${course} concepts and work through practice questions`;

    const sessionId = addSession({
      course,
      date: toDateStamp(date),
      time,
      place,
      topic,
      withBuddy: match.name,
    });
    if (!data.connectedMatchIds.includes(match.id)) {
      toggleConnection(match.id);
    }
    let calendarStatus = 'Added to your Study Buddy calendar.';
    if (Platform.OS !== 'web') {
      try {
        const permission = await Calendar.requestCalendarPermissionsAsync();
        if (permission.status !== 'granted') {
          calendarStatus += ' Allow calendar access to add it to your device calendar.';
        } else {
          const calendars = await Calendar.getCalendarsAsync(
            Calendar.EntityTypes.EVENT,
          );
          const writableCalendar = calendars.find(
            (calendar) => calendar.allowsModifications,
          );
          if (!writableCalendar) {
            calendarStatus += ' No writable device calendar was found.';
          } else {
            const startDate = new Date(date);
            const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
            if (timeMatch) {
              let hour = Number(timeMatch[1]) % 12;
              if (timeMatch[3] === 'PM') hour += 12;
              startDate.setHours(hour, Number(timeMatch[2]), 0, 0);
            }
            const eventId = await Calendar.createEventAsync(
              writableCalendar.id,
              {
                title: `${course} study session with ${match.name}`,
                startDate,
                endDate: new Date(startDate.getTime() + 60 * 60 * 1000),
                location: place,
                notes: topic,
                alarms: [{ relativeOffset: -15 }],
              },
            );
            markCalendarSynced(sessionId, eventId);
            calendarStatus = `Added to your Study Buddy calendar and ${writableCalendar.title}.`;
          }
        }
      } catch {
        calendarStatus += ' It could not be added to your device calendar.';
      }
    }
    Alert.alert(
      'Meetup planned',
      `${match.name} · ${course}\n${formatDateStamp(toDateStamp(date))} at ${time}\n${place}\n${topic}\n\n${calendarStatus}`,
      [
        { text: 'View calendar', onPress: () => router.navigate('/calendar') },
        { text: 'Done' },
      ],
    );
  };

  return (
    <Page>
      <PageHeading
        eyebrow="Your people"
        title="Good study,\nbetter company."
        subtitle="Classmates matched by courses and shared free time."
      />

      <Surface style={[styles.summaryCard, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
        <View style={styles.summaryIcon}>
          <Feather name="target" size={18} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
            Your match signal
          </Text>
          <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
            Matches share a course and free time. Helpers for your focus courses rank first.
          </Text>
        </View>
      </Surface>

      <View style={styles.filterBlock}>
        <SectionHeading title="Browse by course" />
        <View style={styles.filters}>
          <Pill
            label="All"
            active={courseFilter === 'All'}
            onPress={() => setCourseFilter('All')}
          />
          {data.profile.courses.map((course) => (
            <Pill
              key={course}
              label={course}
              active={courseFilter === course}
              onPress={() => setCourseFilter(course)}
            />
          ))}
        </View>
      </View>

      <View style={styles.listHeading}>
        <SectionHeading
          title={`${matches.length} ${matches.length === 1 ? 'classmate' : 'classmates'}`}
        />
        <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>
          Best fit first
        </Text>
      </View>

      {matches.length ? (
        matches.map((match) => {
          const connected = data.connectedMatchIds.includes(match.id);
          const orderedDays = dayOrder.filter((day) => match.commonDays.includes(day));
          return (
            <Surface key={match.id} style={styles.matchCard}>
              <View style={styles.personRow}>
                <PersonAvatar
                  initials={match.initials}
                  color={match.color}
                  size={52}
                />
                <View style={styles.personCopy}>
                  <Text style={[styles.personName, { color: colors.foreground }]}>
                    {match.name}
                  </Text>
                  <Text style={[styles.personMajor, { color: colors.mutedForeground }]}>
                    {match.major}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.scoreText, { color: colors.accentForeground }]}>
                    {match.compatibility}%
                  </Text>
                  <Text style={[styles.scoreCaption, { color: colors.accentForeground }]}>
                    MATCH
                  </Text>
                </View>
              </View>

              <Text style={[styles.about, { color: colors.mutedForeground }]}>
                {match.about}
              </Text>

              <View style={styles.detailGroup}>
                <View style={styles.detailLabelRow}>
                  <Feather name="book-open" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                    Shared courses
                  </Text>
                </View>
                <View style={styles.tags}>
                  {match.commonCourses.map((course) => (
                    <Pill key={course} label={course} />
                  ))}
                </View>
              </View>

              <View style={styles.detailGroup}>
                <View style={styles.detailLabelRow}>
                  <Feather name="clock" size={14} color={colors.primary} />
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                    Free together
                  </Text>
                </View>
                <Text style={[styles.availableText, { color: colors.mutedForeground }]}>
                  {orderedDays.length
                    ? orderedDays.join(' · ')
                    : 'No overlapping days yet'}
                  {'  '}· {match.commonStudyTimes.join(', ')}
                </Text>
              </View>

              {match.supportCourses.length ? (
                <View style={styles.detailGroup}>
                  <View style={styles.detailLabelRow}>
                    <Feather name="star" size={14} color={colors.primary} />
                    <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                      Can help with your focus
                    </Text>
                  </View>
                  <View style={styles.tags}>
                    {match.supportCourses.map((course) => (
                      <Pill key={course} label={course} active />
                    ))}
                  </View>
                </View>
              ) : null}

              <Text style={[styles.about, { color: colors.mutedForeground }]}>
                Prototype example profile · Suggested place: {match.preference}
              </Text>

              <ActionButton
                label={connected ? 'Open chat' : 'Connect'}
                icon={connected ? 'message-circle' : 'user-plus'}
                tone={connected ? 'soft' : 'primary'}
                onPress={() => {
                  if (!connected) toggleConnection(match.id);
                  router.push({
                    pathname: '/(tabs)/chat',
                    params: { buddyId: match.id },
                  });
                }}
              />
              <ActionButton
                label="Plan a meetup"
                icon="calendar"
                tone="accent"
                onPress={() => planMeetup(match)}
              />
            </Surface>
          );
        })
      ) : (
        <Surface style={styles.emptyCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No course matches yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add shared courses, focus areas, and overlapping free days and times to find a study partner.
          </Text>
        </Surface>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  summaryCopy: {
    flex: 1,
    gap: 3,
  },
  summaryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  summaryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  filterBlock: {
    gap: 14,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  sortLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  matchCard: {
    gap: 15,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personCopy: {
    flex: 1,
    gap: 4,
  },
  personName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  personMajor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  scoreBadge: {
    width: 57,
    height: 55,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  scoreCaption: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 1,
  },
  about: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  detailGroup: {
    gap: 8,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  availableText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 250,
  },
});
