import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Layout } from '../constants';

interface PinInputProps {
  onComplete: (pin: string) => void;
  onBiometric?: () => void;
  biometricAvailable?: boolean;
  title?: string;
  subtitle?: string;
  pinLength?: number;
  error?: string;
}

export function PinInput({
  onComplete,
  onBiometric,
  biometricAvailable = false,
  title = '输入 PIN 码',
  subtitle,
  pinLength = 4,
  error,
}: PinInputProps) {
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
      Vibration.vibrate(200);
      setTimeout(() => {
        setPin('');
        setShowError(false);
      }, 1000);
    }
  }, [error]);

  useEffect(() => {
    if (pin.length === pinLength) {
      onComplete(pin);
    }
  }, [pin, pinLength, onComplete]);

  const handlePress = (value: string) => {
    if (pin.length < pinLength) {
      setPin((prev) => prev + value);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {Array(pinLength)
          .fill(0)
          .map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                pin.length > index && styles.dotFilled,
                showError && styles.dotError,
              ]}
            />
          ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [biometricAvailable ? 'bio' : '', '0', 'del'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keyEmpty} />;
              }

              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={onBiometric}
                    activeOpacity={0.7}
                  >
                    <Feather name="smartphone" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                );
              }

              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                  >
                    <Feather name="delete" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handlePress(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {error && showError && <Text style={styles.error}>{error}</Text>}
      </View>
      {renderDots()}
      {renderKeypad()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: Colors.error,
    marginTop: Layout.spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xxl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginHorizontal: Layout.spacing.sm,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Layout.spacing.md,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  keyEmpty: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});

export default PinInput;
