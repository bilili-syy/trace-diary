import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { Layout, Typography } from '../constants';

export type ThemedAlertAction = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface ThemedAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  actions?: ThemedAlertAction[];
  onClose: () => void;
}

export function ThemedAlert({ visible, title, message, actions, onClose }: ThemedAlertProps) {
  const { colors } = useTheme();
  const actionList = actions && actions.length > 0 ? actions : [{ text: '确定' }];
  const stackActions = actionList.length > 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          {title ? <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text> : null}
          {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
          <View style={[styles.actions, stackActions ? styles.actionsStacked : styles.actionsRow]}>
            {actionList.map((action, index) => {
              const isCancel = action.style === 'cancel';
              const isDestructive = action.style === 'destructive';
              const backgroundColor = isDestructive
                ? colors.error
                : isCancel
                ? colors.inputBackground
                : colors.primary;
              const textColor = isDestructive || !isCancel ? '#FFFFFF' : colors.textSecondary;
              const borderStyle = isCancel ? { borderColor: colors.border, borderWidth: 1 } : null;

              return (
                <TouchableOpacity
                  key={`${action.text}-${index}`}
                  style={[
                    styles.actionButton,
                    stackActions && styles.actionButtonStacked,
                    { backgroundColor },
                    borderStyle,
                  ]}
                  onPress={() => {
                    onClose();
                    action.onPress?.();
                  }}
                >
                  <Text style={[styles.actionText, { color: textColor }]}>{action.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Layout.spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Layout.spacing.lg,
  },
  actions: {
    gap: Layout.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    minWidth: 88,
    alignItems: 'center',
  },
  actionButtonStacked: {
    width: '100%',
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default ThemedAlert;
