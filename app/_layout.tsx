import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';
import { isConfigured } from '../src/lib/supabase';
import { colors, space, type } from '../src/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

/** Bounces between the sign-in screen and the app as the session changes. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onSignIn = segments[0] === 'sign-in';
    if (!session && !onSignIn) router.replace('/sign-in');
    else if (session && onSignIn) router.replace('/');
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <>{children}</>;
}

function SetupNotice() {
  return (
    <View style={[s.center, { padding: space.xl, gap: space.md }]}>
      <Text style={type.title}>Habit OS needs its keys</Text>
      <Text style={[type.body, { color: colors.textMuted, textAlign: 'center' }]}>
        Copy <Text style={{ color: colors.text }}>.env.example</Text> to{' '}
        <Text style={{ color: colors.text }}>.env</Text>, paste your Supabase project URL and anon
        key into it, then restart the dev server with{' '}
        <Text style={{ color: colors.text }}>npx expo start -c</Text>.
      </Text>
      <Text style={type.caption}>See README.md for the full setup.</Text>
    </View>
  );
}

export default function RootLayout() {
  if (!isConfigured) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SetupNotice />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGate>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen
                name="habit/[id]"
                options={{ presentation: 'modal', title: 'Habit' }}
              />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
