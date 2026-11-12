import React from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useStudyData, toDateStamp } from '@/context/StudyData';
import {
  ActionButton,
  IconButton,
  Page,
  PageHeading,
  PersonAvatar,
  Pill,
  SectionHeading,
  Surface,
  LoadingState,
} from '@/components/study-ui';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data, ready } = useStudyData();

  if (!ready) return <LoadingState />;

  const firstName = data.profile.name.trim().split(/\s+/)[0] || 'there';
  const today = toDateStamp(new Date());
  const nextSession = [...data.sessions]
    .filter((session) => session.date >= today)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const dayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (!data.profile.name.trim() || !data.profile.courses.length) {
    return (
      <Page>
        <PageHeading
          eyebrow={dayLabel}
          title="Welcome to\nStudy Buddy."
          subtitle="Make your next study session count."
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Set up your study profile"
              onPress={() => router.push('/profile')}
            >
              <PersonAvatar initials="?" size={44} />
            </Pressable>
          }
        />
        <Surface style={styles.setupCard}>
          <View style={[styles.matchIcon, { backgroundColor: colors.accent }]}>
            <Feather name="user-check" size={20} color={colors.accentForeground} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Start with your student profile
          </Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Add your name, courses, study priorities, strengths, and free time. We’ll use them to suggest study partners and make a plan that fits.
          </Text>
          <ActionButton
            label="Set up my profile"
            icon="arrow-right"
            onPress={() => router.push('/profile')}
          />
        </Surface>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        eyebrow={dayLabel}
        title={`${greetingForHour(new Date().getHours())},\n${firstName}.`}
        subtitle="A little progress, together."
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit your study profile"
            onPress={() => router.push('/profile')}
          >
            <PersonAvatar initials={data.profile.name.slice(0, 1).toUpperCase()} size={44} />
          </Pressable>
        }
      />

      <Surface style={[styles.nextCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        <View style={styles.nextTop}>
          <View style={styles.liveTag}>
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.liveLabel, { color: colors.primaryForeground }]}>
              NEXT ON YOUR PLAN
            </Text>
          </View>
          <Feather name="arrow-up-right" size={20} color={colors.primaryForeground} />
        </View>
        {nextSession ? (
          <>
            <Text style={[styles.nextCourse, { color: colors.primaryForeground }]}>
              {nextSession.course}
            </Text>
            <Text style={[styles.nextTopic, { color: colors.primaryForeground }]}>
              {nextSession.topic}
            </Text>
            <View style={styles.nextMeta}>
              <Feather name="calendar" size={14} color={colors.primaryForeground} />
              <Text style={[styles.nextMetaText, { color: colors.primaryForeground }]}>
                {new Date(`${nextSession.date}T12:00:00`).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                · {nextSession.time}
              </Text>
            </View>
            <View style={styles.nextFooter}>
              <View style={styles.placeMeta}>
                <Feather name="map-pin" size={14} color={colors.primaryForeground} />
                <Text style={[styles.nextMetaText, { color: colors.primaryForeground }]} numberOfLines={1}>
                  {nextSession.place}
                </Text>
              </View>
              <ActionButton
                label="Calendar"
                icon="arrow-right"
                tone="accent"
                compact
                onPress={() => router.navigate('/calendar')}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.nextCourse, { color: colors.primaryForeground }]}>
              Your next session starts here
            </Text>
            <Text style={[styles.nextTopic, { color: colors.primaryForeground }]}>
              Choose a time and make a plan that works for you.
            </Text>
            <ActionButton
              label="Plan a study session"
              icon="plus"
              tone="accent"
              onPress={() => router.navigate('/calendar')}
            />
          </>
        )}
      </Surface>

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="Your courses"
          actionLabel="Edit"
          onAction={() => router.push('/profile')}
        />
        <View style={styles.pillRow}>
          {data.profile.courses.length ? (
            data.profile.courses.map((course) => (
              <Pill key={course} label={course} icon="book-open" />
            ))
          ) : (
            <Text style={[styles.mutedNote, { color: colors.mutedForeground }]}>
              Add a course to start finding study buddies.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="Your study needs"
          actionLabel="Update"
          onAction={() => router.push('/profile')}
        />
        <Surface style={styles.needsCard}>
          {data.profile.focusCourses.length ? (
            <>
              <View style={styles.pillRow}>
                {data.profile.focusCourses.map((course) => (
                  <Pill key={course} label={course} icon="target" active />
                ))}
              </View>
              <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                {data.profile.focusTopics ||
                  'Build confidence with a focused review and a few practice problems.'}
              </Text>
            </>
          ) : (
            <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
              Tell us which courses or topics you want to improve. We’ll put those first when suggesting a study plan.
            </Text>
          )}
        </Surface>
      </View>

      <Surface style={styles.matchCard}>
        <View style={[styles.matchIcon, { backgroundColor: colors.accent }]}>
          <Feather name="users" size={19} color={colors.accentForeground} />
        </View>
        <View style={styles.matchCopy}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Better together
          </Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Find classmates who share your courses and free time.
          </Text>
        </View>
        <IconButton
          icon="arrow-up-right"
          label="Find study buddies"
          onPress={() => router.navigate('/matches')}
        />
        <View style={styles.matchButton}>
          <ActionButton
            label="Explore matches"
            icon="arrow-right"
            onPress={() => router.navigate('/matches')}
          />
        </View>
      </Surface>

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="Make room to focus"
          actionLabel="Find a spot"
          onAction={() => router.navigate('/locations')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/locations')}
          style={({ pressed }) => [
            styles.locationRow,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <View style={[styles.locationIcon, { backgroundColor: colors.card }]}>
            <Feather name="map-pin" size={17} color={colors.primary} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={[styles.locationTitle, { color: colors.foreground }]}>
              Find your study space
            </Text>
            <Text style={[styles.locationSubtitle, { color: colors.mutedForeground }]}>
              Browse quiet corners and group rooms
            </Text>
          </View>
          <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  setupCard: {
    gap: 14,
    padding: 20,
  },
  needsCard: {
    gap: 12,
    padding: 16,
  },
  nextCard: {
    minHeight: 224,
    gap: 9,
    padding: 20,
  },
  nextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  nextCourse: {
    fontFamily: 'Inter_700Bold',
    fontSize: 23,
    letterSpacing: -0.5,
  },
  nextTopic: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.86,
  },
  nextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  nextMetaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    flexShrink: 1,
  },
  nextFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 7,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  sectionBlock: {
    gap: 15,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mutedNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 11,
  },
  matchIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCopy: {
    flex: 1,
    minWidth: 160,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  matchButton: {
    width: '100%',
    marginTop: 2,
  },
  locationRow: {
    minHeight: 76,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 12,
  },
  locationIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  locationSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
});
