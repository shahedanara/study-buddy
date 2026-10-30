import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useStudyData } from '@/context/StudyData';
import {
  ActionButton,
  IconButton,
  LoadingState,
  Pill,
  PersonAvatar,
  Surface,
} from '@/components/study-ui';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        style={[
          styles.fieldInput,
          multiline && styles.multilineInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, ready, saveProfile } = useStudyData();
  const [name, setName] = useState(data.profile.name);
  const [major, setMajor] = useState(data.profile.major);
  const [coursesText, setCoursesText] = useState(data.profile.courses.join(', '));
  const [preference, setPreference] = useState(data.profile.preference);
  const [availability, setAvailability] = useState<string[]>(data.profile.availability);

  useEffect(() => {
    if (!ready) return;
    setName(data.profile.name);
    setMajor(data.profile.major);
    setCoursesText(data.profile.courses.join(', '));
    setPreference(data.profile.preference);
    setAvailability(data.profile.availability);
  }, [data.profile, ready]);

  if (!ready) return <LoadingState />;

  const toggleDay = (day: string) => {
    setAvailability((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  };

  const save = () => {
    const courses = Array.from(
      new Set(
        coursesText
          .split(/[,\n]/)
          .map((course) => course.trim())
          .filter(Boolean),
      ),
    );
    if (!name.trim()) {
      Alert.alert('Add your name', 'Your study group will use this to recognize you.');
      return;
    }
    if (!courses.length) {
      Alert.alert('Add at least one course', 'Course IDs help us find the right classmates.');
      return;
    }
    if (!availability.length) {
      Alert.alert('Choose your free days', 'Select at least one day when you are usually available.');
      return;
    }
    saveProfile({
      name: name.trim(),
      major: major.trim() || 'Undeclared',
      courses,
      availability: days.filter((day) => availability.includes(day)),
      preference: preference.trim() || 'No preference',
    });
    Alert.alert('Profile saved', 'Your course matches will update with your new details.');
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 : insets.top + 10,
            paddingBottom: Platform.OS === 'web' ? 58 : Math.max(insets.bottom, 18) + 24,
          },
        ]}
        bottomOffset={18}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topbar}>
          <IconButton icon="arrow-left" label="Go back" onPress={() => router.back()} />
          <Text style={[styles.topbarTitle, { color: colors.foreground }]}>
            Your study profile
          </Text>
          <View style={styles.topbarSpacer} />
        </View>

        <View style={styles.profileIntro}>
          <PersonAvatar initials={name.trim().slice(0, 1).toUpperCase() || 'A'} size={64} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            Make your profile yours.
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Share what you study and when you like to focus.
          </Text>
        </View>

        <Surface style={styles.formCard}>
          <ProfileField
            label="YOUR NAME"
            value={name}
            onChangeText={setName}
            placeholder="Alex Morgan"
          />
          <ProfileField
            label="MAJOR"
            value={major}
            onChangeText={setMajor}
            placeholder="Computer Science"
          />
          <ProfileField
            label="COURSES"
            value={coursesText}
            onChangeText={setCoursesText}
            placeholder="CS101, Physics 101"
            multiline
          />
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Separate course names or IDs with commas.
          </Text>
        </Surface>

        <View style={styles.availabilitySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            When are you usually free?
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Select any days that work for you.
          </Text>
          <View style={styles.dayGrid}>
            {days.map((day) => (
              <Pill
                key={day}
                label={day}
                active={availability.includes(day)}
                onPress={() => toggleDay(day)}
              />
            ))}
          </View>
        </View>

        <Surface style={styles.formCard}>
          <ProfileField
            label="PREFERRED STUDY SETTING"
            value={preference}
            onChangeText={setPreference}
            placeholder="Campus library"
          />
          <View style={styles.preferenceHint}>
            <Feather name="coffee" size={15} color={colors.primary} />
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              This helps classmates suggest a place that suits you.
            </Text>
          </View>
        </Surface>

        <ActionButton
          label="Save my profile"
          icon="check"
          onPress={save}
        />
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 21,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -9,
    marginBottom: -8,
  },
  topbarTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  topbarSpacer: {
    width: 42,
  },
  profileIntro: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
    paddingBottom: 3,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  formCard: {
    gap: 15,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.15,
  },
  fieldInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 66,
    textAlignVertical: 'top',
  },
  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  availabilitySection: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  preferenceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
});
