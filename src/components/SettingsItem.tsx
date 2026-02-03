import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Layout } from '../constants';
import { useTheme } from '../context/ThemeProvider';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  danger?: boolean;
  rightElement?: ReactNode;
}

export function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
  danger = false,
  rightElement,
}: SettingsItemProps) {
  const { colors } = useTheme();

  const content = (
    <>
      <View style={[
        styles.iconContainer, 
        { backgroundColor: danger ? colors.error + '15' : colors.primary + '15' }
      ]}>
        <Feather 
          name={icon as any} 
          size={20} 
          color={danger ? colors.error : colors.primary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: danger ? colors.error : colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={switchValue ? colors.primary : colors.textLight}
        />
      ) : (
        <Feather name="chevron-right" size={20} color={colors.textMuted} />
      )}
    </>
  );

  if (hasSwitch) {
    return <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>{content}</View>;
  }

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default SettingsItem;
