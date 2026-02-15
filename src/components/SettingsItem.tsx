import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Layout, Typography } from '../constants';
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
    minHeight: 68,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: Layout.spacing.xs / 4,
  },
});

export default SettingsItem;
