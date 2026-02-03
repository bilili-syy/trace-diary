import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Layout, MOOD_OPTIONS } from '../constants';

interface MoodPickerProps {
  selectedMood?: string;
  onSelect: (mood: string) => void;
}

export function MoodPicker({ selectedMood, onSelect }: MoodPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>心情</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.emoji}
            style={[
              styles.moodItem,
              selectedMood === option.emoji && styles.moodItemSelected,
              selectedMood === option.emoji && { borderColor: option.color },
            ]}
            onPress={() => onSelect(option.emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.moodEmoji}>{option.emoji}</Text>
            <Text style={styles.moodLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Layout.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.md,
  },
  moodItem: {
    alignItems: 'center',
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodItemSelected: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default MoodPicker;
