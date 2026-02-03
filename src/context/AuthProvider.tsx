import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAppLockEnabled, setAppLockEnabled, getPinHash, setPinHash, clearPin } from '../api/storage';
import { hashPin, verifyPin } from '../utils/cryptoUtils';

// 认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  isAppLockEnabled: boolean;
  biometricAvailable: boolean;
  biometricType: LocalAuthentication.AuthenticationType[];
  isLoading: boolean;
}

// Context 接口
interface AuthContextType {
  state: AuthState;
  authenticate: () => Promise<boolean>;
  authenticateWithPin: (pin: string) => boolean;
  enableAppLock: (pin: string) => void;
  disableAppLock: () => void;
  changePin: (oldPin: string, newPin: string) => boolean;
  setAuthenticated: (value: boolean) => void;
  checkBiometricAvailability: () => Promise<void>;
}

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  isAppLockEnabled: false,
  biometricAvailable: false,
  biometricType: [],
  isLoading: true,
};

// 创建 Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // 检查生物识别可用性
  const checkBiometricAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setState((prev) => ({
        ...prev,
        biometricAvailable: compatible && enrolled,
        biometricType: types,
      }));
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      const isLockEnabled = getAppLockEnabled();
      await checkBiometricAvailability();

      setState((prev) => ({
        ...prev,
        isAppLockEnabled: isLockEnabled,
        isAuthenticated: !isLockEnabled,
        isLoading: false,
      }));
    };

    initialize();
  }, [checkBiometricAvailability]);

  // 生物识别认证
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '请验证您的身份',
        fallbackLabel: '使用 PIN 码',
        cancelLabel: '取消',
        disableDeviceFallback: true,
      });

      if (result.success) {
        setState((prev) => ({ ...prev, isAuthenticated: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }, []);

  // PIN 码认证
  const authenticateWithPin = useCallback((pin: string): boolean => {
    const storedHash = getPinHash();
    if (!storedHash) return false;

    const isValid = verifyPin(pin, storedHash);
    if (isValid) {
      setState((prev) => ({ ...prev, isAuthenticated: true }));
    }
    return isValid;
  }, []);

  // 启用应用锁
  const enableAppLock = useCallback((pin: string) => {
    const hash = hashPin(pin);
    setPinHash(hash);
    setAppLockEnabled(true);
    setState((prev) => ({
      ...prev,
      isAppLockEnabled: true,
    }));
  }, []);

  // 禁用应用锁
  const disableAppLock = useCallback(() => {
    clearPin();
    setAppLockEnabled(false);
    setState((prev) => ({
      ...prev,
      isAppLockEnabled: false,
      isAuthenticated: true,
    }));
  }, []);

  // 修改 PIN 码
  const changePin = useCallback((oldPin: string, newPin: string): boolean => {
    const storedHash = getPinHash();
    if (!storedHash) return false;

    if (!verifyPin(oldPin, storedHash)) {
      return false;
    }

    const newHash = hashPin(newPin);
    setPinHash(newHash);
    return true;
  }, []);

  // 设置认证状态
  const setAuthenticated = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isAuthenticated: value }));
  }, []);

  const value: AuthContextType = {
    state,
    authenticate,
    authenticateWithPin,
    enableAppLock,
    disableAppLock,
    changePin,
    setAuthenticated,
    checkBiometricAvailability,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
