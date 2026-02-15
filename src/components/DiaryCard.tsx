import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DiaryEntry } from '../types';
import { Colors, Layout, Typography } from '../constants';
import { useTheme } from '../context/ThemeProvider';
import { formatDateDisplay, formatWeekday } from '../utils/dateUtils';
import { WEATHER_OPTIONS } from '../constants/Styles';
import { getImageUri } from '../utils/imageStorage';
import { getEntryImages, stripMarkdown } from '../utils/entryUtils';

interface DiaryCardProps {
  entry: DiaryEntry;
  onPress: () => void;
  onLongPress?: () => void;
}

export function DiaryCard({ entry, onPress, onLongPress }: DiaryCardProps) {
  const { colors } = useTheme();
  const weatherOption = WEATHER_OPTIONS.find((w) => w.id === entry.weather);
  const plainContent = stripMarkdown(entry.content);
  const contentPreview = plainContent.length > 100 
    ? plainContent.substring(0, 100) + '...' 
    : plainContent;
  const entryImages = getEntryImages(entry);
  const displayImages = entryImages.slice(0, 3);
  const moreCount = entryImages.length - 3;

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} 
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {entry.mood && (
            <View style={[styles.moodBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={styles.mood}>{entry.mood}</Text>
            </View>
          )}
          <View style={styles.dateContainer}>
            <Text style={[styles.date, { color: colors.textPrimary }]}>{formatDateDisplay(entry.date)}</Text>
            <Text style={[styles.weekday, { color: colors.textSecondary }]}>{formatWeekday(entry.date)}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {weatherOption && (
            <View style={[styles.weatherBadge, { backgroundColor: colors.inputBackground }]}>
              <Feather 
                name={weatherOption.icon as any} 
                size={16} 
                color={Colors.weatherColors[entry.weather as keyof typeof Colors.weatherColors]} 
              />
            </View>
          )}
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.contentText, { color: colors.textPrimary }]} numberOfLines={3}>
          {contentPreview}
        </Text>
        {displayImages.length > 0 && (
          <View style={styles.imagesRow}>
            {displayImages.map((img, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image 
                  source={{ uri: getImageUri(img) }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                {index === 2 && moreCount > 0 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{moreCount}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={[styles.metaTag, { backgroundColor: colors.primary + '12' }]}>
          <Feather name="edit-3" size={11} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.primary }]}>{entry.wordCount} 字</Text>
        </View>
        {entry.templateUsed && entry.templateUsed !== 'free' && (
          <View style={[styles.metaTag, { backgroundColor: colors.primary + '12' }]}>
            <Feather name="file-text" size={11} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary }]}>模板</Text>
          </View>
        )}
        {entryImages.length > 0 && (
          <View style={[styles.metaTag, { backgroundColor: colors.primary + '12' }]}>
            <Feather name="image" size={11} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary }]}>{entryImages.length}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.xs,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  moodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.sm,
  },
  mood: {
    fontSize: Typography.fontSize['2xl'],
  },
  dateContainer: {
    flexDirection: 'column',
  },
  date: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  weekday: {
    fontSize: Typography.fontSize.xs,
    marginTop: Layout.spacing.xs / 4,
  },
  weatherBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginVertical: Layout.spacing.sm,
  },
  contentText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Math.round(Typography.fontSize.sm * Typography.lineHeight.relaxed),
  },
  imagesRow: {
    flexDirection: 'row',
    marginTop: Layout.spacing.sm,
    gap: 6,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: Layout.borderRadius.sm,
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs / 2,
    borderRadius: 12,
    gap: Layout.spacing.xs / 2,
  },
  metaText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default DiaryCard;
