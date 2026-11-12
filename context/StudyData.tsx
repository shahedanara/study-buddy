import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = '@study-buddy/local-data-v1';

export type StudyProfile = {
  name: string;
  major: string;
  courses: string[];
  focusCourses: string[];
  focusTopics: string;
  helpCourses: string[];
  availability: string[];
  studyTimes: string[];
  preference: string;
};

export type StudySession = {
  id: string;
  course: string;
  date: string;
  time: string;
  place: string;
  topic: string;
  withBuddy?: string;
  calendarEventId?: string;
};

export type ChatMessage = {
  id: string;
  channel: string;
  author: string;
  text: string;
  createdAt: string;
  isMine: boolean;
};

export type StudyData = {
  profile: StudyProfile;
  sessions: StudySession[];
  connectedMatchIds: string[];
  bookings: string[];
  messages: ChatMessage[];
};

export type StudyBuddy = {
  id: string;
  name: string;
  major: string;
  courses: string[];
  strengths: string[];
  availability: string[];
  studyTimes: string[];
  preference: string;
  initials: string;
  color: string;
  about: string;
};

const defaultProfile: StudyProfile = {
  name: '',
  major: '',
  courses: [],
  focusCourses: [],
  focusTopics: '',
  helpCourses: [],
  availability: [],
  studyTimes: [],
  preference: '',
};

function dayStamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const starterData: StudyData = {
  profile: defaultProfile,
  sessions: [],
  connectedMatchIds: [],
  bookings: [],
  messages: [
    {
      id: 'physics-welcome',
      channel: 'Physics 101',
      author: 'Sofia Chen',
      text: 'Anyone want to review the motion chapter together this week?',
      createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
      isMine: false,
    },
    {
      id: 'physics-reply',
      channel: 'Physics 101',
      author: 'Noah Williams',
      text: 'I’m in. Wednesday afternoon at the library works for me.',
      createdAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      isMine: false,
    },
    {
      id: 'cs-welcome',
      channel: 'CS101',
      author: 'Maya Patel',
      text: 'I made a short list of practice questions for our next session.',
      createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      isMine: false,
    },
  ],
};

export const studyBuddies: StudyBuddy[] = [
  {
    id: 'sofia',
    name: 'Sofia Chen',
    major: 'Mechanical Engineering',
    courses: ['CS101', 'Physics 101'],
    strengths: ['Physics 101'],
    availability: ['Mon', 'Wed', 'Thu'],
    studyTimes: ['Afternoon'],
    preference: 'Library',
    initials: 'SC',
    color: '#DCE8C9',
    about: 'Big on focused study blocks and shared notes.',
  },
  {
    id: 'maya',
    name: 'Maya Patel',
    major: 'Computer Science',
    courses: ['CS101', 'Math 201'],
    strengths: ['CS101'],
    availability: ['Mon', 'Wed', 'Fri'],
    studyTimes: ['Afternoon', 'Evening'],
    preference: 'Quiet study rooms',
    initials: 'MP',
    color: '#F2DCCF',
    about: 'Likes to work through problems together.',
  },
  {
    id: 'sarah',
    name: 'Sarah Johnson',
    major: 'Applied Mathematics',
    courses: ['Math 201', 'CS101'],
    strengths: ['Math 201'],
    availability: ['Mon', 'Wed', 'Fri'],
    studyTimes: ['Afternoon'],
    preference: 'Campus library',
    initials: 'SJ',
    color: '#E8DDF2',
    about: 'Enjoys explaining math concepts with step-by-step examples.',
  },
  {
    id: 'noah',
    name: 'Noah Williams',
    major: 'Physics',
    courses: ['Physics 101', 'Math 201'],
    strengths: ['Physics 101', 'Math 201'],
    availability: ['Wed', 'Fri'],
    studyTimes: ['Afternoon', 'Evening'],
    preference: 'Campus library',
    initials: 'NW',
    color: '#D9E2F2',
    about: 'Usually free after class for a quick review.',
  },
  {
    id: 'lina',
    name: 'Lina Haddad',
    major: 'Data Science',
    courses: ['CS101', 'Physics 101', 'Bio 110'],
    strengths: ['CS101'],
    availability: ['Tue', 'Fri', 'Sat'],
    studyTimes: ['Morning', 'Afternoon'],
    preference: 'Quiet pods',
    initials: 'LH',
    color: '#F0E2B9',
    about: 'Prefers small groups and a calm space.',
  },
];

type StudyDataContextValue = {
  data: StudyData;
  ready: boolean;
  saveProfile: (profile: StudyProfile) => void;
  addSession: (session: Omit<StudySession, 'id'>) => string;
  markCalendarSynced: (sessionId: string, calendarEventId: string) => void;
  toggleConnection: (matchId: string) => void;
  toggleBooking: (placeId: string) => void;
  sendMessage: (channel: string, text: string) => void;
};

const StudyDataContext = createContext<StudyDataContextValue | null>(null);

function makeId() {
  return `${Date.now().toString()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function StudyDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StudyData>(starterData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<StudyData>;
          setData({
            ...starterData,
            ...parsed,
            profile: {
              ...starterData.profile,
              ...parsed.profile,
              focusCourses: parsed.profile?.focusCourses ?? [],
              focusTopics: parsed.profile?.focusTopics ?? '',
              helpCourses: parsed.profile?.helpCourses ?? [],
              studyTimes: parsed.profile?.studyTimes ?? ['Afternoon'],
            },
            sessions: parsed.sessions ?? starterData.sessions,
            connectedMatchIds: parsed.connectedMatchIds ?? [],
            bookings: parsed.bookings ?? [],
            messages: parsed.messages ?? starterData.messages,
          });
        }
      })
      .catch(() => {
        // The app remains usable with its starter content if device storage is unavailable.
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      // Keep in-memory interactions responsive if storage temporarily fails.
    });
  }, [data, ready]);

  const saveProfile = useCallback((profile: StudyProfile) => {
    setData((current) => ({ ...current, profile }));
  }, []);

  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const id = makeId();
    setData((current) => ({
      ...current,
      sessions: [...current.sessions, { ...session, id }].sort(
        (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      ),
    }));
    return id;
  }, []);

  const markCalendarSynced = useCallback(
    (sessionId: string, calendarEventId: string) => {
      setData((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === sessionId ? { ...session, calendarEventId } : session,
        ),
      }));
    },
    [],
  );

  const toggleConnection = useCallback((matchId: string) => {
    setData((current) => ({
      ...current,
      connectedMatchIds: current.connectedMatchIds.includes(matchId)
        ? current.connectedMatchIds.filter((id) => id !== matchId)
        : [...current.connectedMatchIds, matchId],
    }));
  }, []);

  const toggleBooking = useCallback((placeId: string) => {
    setData((current) => ({
      ...current,
      bookings: current.bookings.includes(placeId)
        ? current.bookings.filter((id) => id !== placeId)
        : [...current.bookings, placeId],
    }));
  }, []);

  const sendMessage = useCallback((channel: string, text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    setData((current) => ({
      ...current,
      messages: [
        ...current.messages,
        {
          id: makeId(),
          channel,
          author: current.profile.name,
          text: cleanText,
          createdAt: new Date().toISOString(),
          isMine: true,
        },
      ],
    }));
  }, []);

  const value = useMemo(
    () => ({
      data,
      ready,
      saveProfile,
      addSession,
      markCalendarSynced,
      toggleConnection,
      toggleBooking,
      sendMessage,
    }),
    [
      data,
      ready,
      saveProfile,
      addSession,
      markCalendarSynced,
      toggleConnection,
      toggleBooking,
      sendMessage,
    ],
  );

  return (
    <StudyDataContext.Provider value={value}>
      {children}
    </StudyDataContext.Provider>
  );
}

export function useStudyData() {
  const value = useContext(StudyDataContext);
  if (!value) {
    throw new Error('useStudyData must be used inside StudyDataProvider');
  }
  return value;
}

export function toDateStamp(date: Date) {
  return dayStamp(date);
}

export function formatDateStamp(dateStampValue: string) {
  const [year, month, day] = dateStampValue.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function initialsForName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
