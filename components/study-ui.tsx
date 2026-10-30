import React, { type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type PageProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Page({ children, contentStyle }: PageProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.pageContent,
          {
            paddingTop: Platform.OS === 'web' ? 67 : insets.top + 10,
            paddingBottom: Platform.OS === 'web' ? 58 : 28,
          },
          contentStyle,
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Surface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Feather>['name'];
  tone?: 'primary' | 'soft' | 'outline' | 'accent';
  compact?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  compact = false,
  disabled = false,
  style,
}: ButtonProps) {
  const colors = useColors();
  const buttonColors = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      foreground: colors.primaryForeground,
    },
    soft: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
      foreground: colors.secondaryForeground,
    },
    outline: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      foreground: colors.foreground,
    },
    accent: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      foreground: colors.accentForeground,
    },
  }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        {
          backgroundColor: buttonColors.backgroundColor,
          borderColor: buttonColors.borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {icon ? (
        <Feather name={icon} size={compact ? 15 : 17} color={buttonColors.foreground} />
      ) : null}
      <Text
        style={[
          styles.buttonLabel,
          compact && styles.buttonLabelCompact,
          { color: buttonColors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Feather name={icon} size={20} color={colors.foreground} />
    </Pressable>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  const content = (
    <>
      {icon ? (
        <Feather
          name={icon}
          size={13}
          color={active ? colors.primaryForeground : colors.mutedForeground}
        />
      ) : null}
      <Text
        style={[
          styles.pillText,
          { color: active ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </>
  );
  const style = ({ pressed }: { pressed: boolean }) => [
    styles.pill,
    {
      backgroundColor: active ? colors.primary : colors.card,
      borderColor: active ? colors.primary : colors.border,
      opacity: pressed ? 0.78 : 1,
    },
  ];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  ) : (
    <View style={style({ pressed: false })}>{content}</View>
  );
}

export function SectionHeading({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[styles.sectionAction, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PersonAvatar({
  initials,
  color,
  size = 46,
}: {
  initials: string;
  color?: string;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? colors.secondary,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: colors.foreground }]}>
        {initials}
      </Text>
    </View>
  );
}

export function LoadingState({ label = 'Getting your study space ready' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.loadingLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    gap: 22,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
    gap: 5,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.9,
  },
  pageSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
  },
  surface: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonCompact: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
  },
  buttonLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  buttonLabelCompact: {
    fontSize: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderWidth: 1,
    borderRadius: 30,
    minHeight: 35,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.35,
  },
  sectionAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
