import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { queryClient } from '@/lib/queryClient';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/lib/toast';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import { LogBox } from 'react-native';
import { useSavingsQueueSync } from '@/lib/hooks/useSavingsQueueSync';

// Keep the splash screen visible while we fetch resources
void SplashScreen.preventAutoHideAsync();

// Suppress known warnings from third-party libraries
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture',
]);

function RootLayoutContent() {
  useFrameworkReady();
  useSavingsQueueSync();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const { theme } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
  });

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (fontsLoaded && isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isAppReady]);

  const handleSplashReady = () => {
    setIsAppReady(true);
  };

  if (!fontsLoaded || !isAppReady) {
    return <CustomSplashScreen onReady={handleSplashReady} />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Disable swipe gesture between auth and tabs
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Toast config={toastConfig} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
