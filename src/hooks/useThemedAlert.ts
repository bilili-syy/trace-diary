import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import type { ThemedAlertAction } from '../components/ThemedAlert';

interface AlertConfig {
  title: string;
  message?: string;
  actions?: ThemedAlertAction[];
}

export function useThemedAlert() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((title: string, message?: string, actions?: ThemedAlertAction[]) => {
    if (Platform.OS === 'android') {
      setAlertConfig({ title, message, actions });
      return;
    }
    Alert.alert(title, message, actions as any);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return { showAlert, alertConfig, hideAlert };
}

export default useThemedAlert;
