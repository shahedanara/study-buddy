import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useStudyData } from '@/context/StudyData';
import {
  ActionButton,
  LoadingState,
  Page,
  PageHeading,
  SectionHeading,
  Surface,
} from '@/components/study-ui';

const spaces = [
  {
    id: 'room-201',
    name: 'Group Study Room 201',
    type: 'Group room',
    floor: 'Library · Level 2',
    availability: 'Available for 1 hour',
    capacity: '4–6 people',
    icon: 'users' as const,
    marker: '1',
    markerStyle: { left: '21%', top: '34%' },
  },
  {
    id: 'quiet-pods',
    name: 'Quiet Corner Pods',
    type: 'Quiet space',
    floor: 'Learning Commons · Level 1',
    availability: 'Available for 1 hour',
    capacity: '1–2 people',
    icon: 'headphones' as const,
    marker: '2',
    markerStyle: { left: '67%', top: '57%' },
  },
  {
    id: 'north-tables',
    name: 'North Library Tables',
    type: 'Open seating',
    floor: 'Library · North wing',
    availability: 'Usually quiet',
    capacity: 'Open seating',
    icon: 'book-open' as const,
    marker: '3',
    markerStyle: { left: '45%', top: '72%' },
  },
];

export default function LocationsScreen() {
  const colors = useColors();
  const { data, ready, toggleBooking } = useStudyData();
  const [search, setSearch] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('room-201');

  const filteredSpaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return spaces;
    return spaces.filter((space) =>
      `${space.name} ${space.type} ${space.floor}`.toLowerCase().includes(query),
    );
  }, [search]);

  if (!ready) return <LoadingState />;

  const bookSpace = (space: (typeof spaces)[number]) => {
    const alreadyBooked = data.bookings.includes(space.id);
    if (alreadyBooked) {
      toggleBooking(space.id);
      Alert.alert('Reservation removed', `${space.name} is no longer in your saved bookings.`);
      return;
    }
    toggleBooking(space.id);
    Alert.alert(
      'Space reserved',
      `${space.name} has been saved to your Study Buddy bookings.`,
    );
  };

  return (
    <Page>
      <PageHeading
        eyebrow="Study spaces"
        title="Find your\nfocus place."
        subtitle="A good spot makes the next hour count."
      />

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          accessibilityLabel="Search study spaces"
          testID="search-spaces"
          value={search}
          onChangeText={setSearch}
          placeholder="Search campus spaces"
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearch('')}
          >
            <Feather name="x-circle" size={17} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <Surface style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={[styles.mapTitle, { color: colors.foreground }]}>
              Campus spaces
            </Text>
            <Text style={[styles.mapSubtitle, { color: colors.mutedForeground }]}>
              SAMPLE CAMPUS DIRECTORY
            </Text>
          </View>
          <View style={[styles.mapBadge, { backgroundColor: colors.accent }]}>
            <Feather name="map" size={14} color={colors.accentForeground} />
          </View>
        </View>
        <View style={[styles.map, { backgroundColor: colors.secondary }]}>
          <View style={[styles.greenPatch, { backgroundColor: colors.accent }]} />
          <View style={[styles.road, styles.roadOne, { backgroundColor: colors.card }]} />
          <View style={[styles.road, styles.roadTwo, { backgroundColor: colors.card }]} />
          <View style={[styles.road, styles.roadThree, { backgroundColor: colors.card }]} />
          <View style={styles.mapLabelTop}>
            <Feather name="navigation" size={10} color={colors.mutedForeground} />
            <Text style={[styles.mapSmallLabel, { color: colors.mutedForeground }]}>
              LIBRARY QUAD
            </Text>
          </View>
          {spaces.map((space) => {
            const selected = selectedSpace === space.id;
            return (
              <Pressable
                key={space.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${space.name}`}
                onPress={() => setSelectedSpace(space.id)}
                style={[
                  styles.mapMarker,
                  space.markerStyle,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.markerNumber,
                    { color: selected ? colors.primaryForeground : colors.primary },
                  ]}
                >
                  {space.marker}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.mapLegend}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.mapSmallLabel, { color: colors.foreground }]}>
              {filteredSpaces.length} spots
            </Text>
          </View>
        </View>
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          Sample spaces for the prototype. Reservations are saved on this device.
        </Text>
      </Surface>

      <View style={styles.listSection}>
        <SectionHeading
          title="Nearby study spots"
          actionLabel={`${filteredSpaces.length} spaces`}
        />
        {filteredSpaces.length ? (
          filteredSpaces.map((space) => {
            const booked = data.bookings.includes(space.id);
            const selected = selectedSpace === space.id;
            return (
              <Pressable
                key={space.id}
                accessibilityRole="button"
                onPress={() => setSelectedSpace(space.id)}
                style={({ pressed }) => [
                  styles.spaceCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={[styles.spaceIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={space.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.spaceInfo}>
                  <View style={styles.spaceTitleRow}>
                    <Text style={[styles.spaceName, { color: colors.foreground }]} numberOfLines={1}>
                      {space.name}
                    </Text>
                  </View>
                  <Text style={[styles.spaceFloor, { color: colors.mutedForeground }]}>
                    {space.floor}
                  </Text>
                  <View style={styles.spaceMeta}>
                    <View style={[styles.availabilityDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.spaceAvailability, { color: colors.primary }]}>
                      {space.availability}
                    </Text>
                  </View>
                  <Text style={[styles.capacity, { color: colors.mutedForeground }]}>
                    {space.capacity}
                  </Text>
                  <View style={styles.bookingButton}>
                    <ActionButton
                      label={booked ? 'Booked · Cancel' : 'Reserve spot'}
                      icon={booked ? 'check' : 'arrow-right'}
                      tone={booked ? 'soft' : 'primary'}
                      compact
                      onPress={() => bookSpace(space)}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Surface style={styles.noResults}>
            <Feather name="search" size={20} color={colors.primary} />
            <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
              No spaces match “{search}”. Try another search.
            </Text>
          </Surface>
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    height: 49,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    paddingVertical: 8,
    outlineStyle: 'none',
  } as never,
  mapCard: {
    padding: 15,
    gap: 13,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  mapSubtitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  mapBadge: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    height: 196,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  greenPatch: {
    position: 'absolute',
    width: 112,
    height: 80,
    borderRadius: 30,
    left: '38%',
    top: '34%',
    opacity: 0.7,
    transform: [{ rotate: '-14deg' }],
  },
  road: {
    position: 'absolute',
    height: 12,
    borderRadius: 10,
    opacity: 0.9,
  },
  roadOne: {
    width: '120%',
    left: '-8%',
    top: '30%',
    transform: [{ rotate: '-14deg' }],
  },
  roadTwo: {
    width: '110%',
    left: '-6%',
    top: '61%',
    transform: [{ rotate: '17deg' }],
  },
  roadThree: {
    width: '72%',
    left: '24%',
    top: '49%',
    transform: [{ rotate: '62deg' }],
  },
  mapLabelTop: {
    position: 'absolute',
    top: 13,
    left: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mapSmallLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  mapMarker: {
    position: 'absolute',
    width: 31,
    height: 31,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  markerNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  mapLegend: {
    position: 'absolute',
    right: 12,
    bottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  listSection: {
    gap: 13,
  },
  spaceCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  spaceIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceInfo: {
    flex: 1,
    gap: 5,
  },
  spaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceName: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  spaceFloor: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  spaceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
  },
  spaceAvailability: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  capacity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  bookingButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  noResults: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
