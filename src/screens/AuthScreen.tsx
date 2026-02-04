import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PinInput } from '../components';
import { useAuth } from '../context';
import { useTheme } from '../context/ThemeProvider';
import { Layout } from '../constants';

export function AuthScreen() {
  const { state, authenticate, authenticateWithPin } = useAuth();
  const { colors, isDark } = useTheme();
  const [error, setError] = useState<string>('');

  const handleBiometricAuth = useCallback(async () => {
    if (!state.biometricAvailable) return;
    
    const success = await authenticate();
    if (!success) {
      setError('');
    }
  }, [authenticate, state.biometricAvailable]);

  useEffect(() => {
    if (state.biometricAvailable && !state.isAuthenticated) {
      handleBiometricAuth();
    }
  }, []);

  const handlePinComplete = useCallback((pin: string) => {
    const success = authenticateWithPin(pin);
    if (!success) {
      setError('PIN 码错误，请重试');
    }
  }, [authenticateWithPin]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="lock" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.appName, { color: colors.textPrimary }]}>素履</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>记录人生轨迹，素雅且纯粹</Text>
      </View>

      <PinInput
        onComplete={handlePinComplete}
        onBiometric={handleBiometricAuth}
        biometricAvailable={state.biometricAvailable}
        title="输入 PIN 码解锁"
        error={error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: Layout.spacing.xxl,
    paddingBottom: Layout.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
});

export default AuthScreen;
