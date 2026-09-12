import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius, space, type } from '../lib/theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}) {
  const tint =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.bad : colors.surfaceAlt;
  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onAccent
      : variant === 'ghost'
        ? colors.textMuted
        : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: variant === 'ghost' ? 'transparent' : tint },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[s.buttonLabel, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text style={type.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        {...props}
        style={[s.input, props.style]}
      />
      {hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tint,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  tint?: string;
}) {
  const color = tint ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text
        style={[
          s.chipLabel,
          selected && { color: colors.onAccent, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <View style={s.empty}>
      <Text style={type.heading}>{title}</Text>
      {body ? <Text style={[type.caption, { textAlign: 'center' }]}>{body}</Text> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={s.empty}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <View style={s.errorNote}>
      <Text style={{ color: colors.bad, fontSize: 13 }}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  button: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    color: colors.text,
    fontSize: 15,
  },
  chip: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  empty: {
    paddingVertical: space.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  errorNote: {
    backgroundColor: 'rgba(242,85,90,0.12)',
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: 'rgba(242,85,90,0.3)',
  },
});
