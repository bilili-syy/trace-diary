import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DiaryProvider, AuthProvider, ThemeProvider } from './src/context';
import { RootNavigator } from './src/navigation';
import { initializeStorage } from './src/api/storage';

export default function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeStorage();
        setIsStorageReady(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setIsStorageReady(true);
      }
    };
    init();
  }, []);

  if (!isStorageReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <DiaryProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </DiaryProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
