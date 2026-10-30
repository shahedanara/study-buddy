import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { studyBuddies, useStudyData } from '@/context/StudyData';
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
  const { data, ready, toggleConnection } = useStudyData();
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
        const courseScore =
          data.profile.courses.length > 0
            ? commonCourses.length / data.profile.courses.length
            : 0;
        const timeScore =
          data.profile.availability.length > 0
            ? commonDays.length / data.profile.availability.length
            : 0;
        const compatibility = Math.round(45 + courseScore * 35 + timeScore * 20);
        return { ...buddy, commonCourses, commonDays, compatibility };
      })
      .filter((match) => {
        if (!match.commonCourses.length) return false;
        if (courseFilter === 'All') return true;
        return match.commonCourses.some(
          (course) => courseKey(course) === courseKey(courseFilter),
        );
      })
      .sort((a, b) => b.compatibility - a.compatibility);
  }, [data.profile.availability, data.profile.courses, courseFilter]);

  if (!ready) return <LoadingState />;

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
            Course overlap and availability shape each score.
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
                  {'  '}· {match.preference}
                </Text>
              </View>

              <ActionButton
                label={connected ? 'Connected' : 'Connect'}
                icon={connected ? 'check' : 'user-plus'}
                tone={connected ? 'soft' : 'primary'}
                onPress={() => toggleConnection(match.id)}
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
            Add a shared course in your profile to see classmates who study it.
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
