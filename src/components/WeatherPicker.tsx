import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Layout, WEATHER_OPTIONS } from '../constants';

interface WeatherPickerProps {
  selectedWeather?: string;
  onSelect: (weather: string) => void;
}

export function WeatherPicker({ selectedWeather, onSelect }: WeatherPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>天气</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {WEATHER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.weatherItem,
              selectedWeather === option.id && styles.weatherItemSelected,
            ]}
            onPress={() => onSelect(option.id)}
            activeOpacity={0.7}
          >
            <Feather 
              name={option.icon as any} 
              size={24} 
              color={
                selectedWeather === option.id 
                  ? Colors.weatherColors[option.id as keyof typeof Colors.weatherColors]
                  : Colors.textSecondary
              } 
            />
            <Text style={[
              styles.weatherLabel,
              selectedWeather === option.id && styles.weatherLabelSelected,
            ]}>
              {option.label}
            </Text>
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
  weatherItem: {
    alignItems: 'center',
    padding: Layout.spacing.sm,
    marginRight: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.inputBackground,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  weatherItemSelected: {
    backgroundColor: Colors.cardBackground,
    borderColor: Colors.primary,
  },
  weatherLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  weatherLabelSelected: {
    color: Colors.textPrimary,
  },
});

export default WeatherPicker;
