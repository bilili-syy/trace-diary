import React, { useCallback, useMemo, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { DiaryCard, ThemedAlert } from '../components';
import { useDiary } from '../context';
import { useTheme } from '../context/ThemeProvider';
import { Layout, MOOD_OPTIONS, WEATHER_OPTIONS } from '../constants';
import { RootStackParamList, MainTabParamList, DiaryEntry } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { getOnboardingDone, setOnboardingDone } from '../api/storage';
import { useThemedAlert } from '../hooks';

interface FilterState {
  mood: string | null;
  weather: string | null;
  tag: string | null;
}

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, getThisDayLastYearEntries, deleteEntry } = useDiary();
  const { colors, isDark } = useTheme();
  const { showAlert, alertConfig, hideAlert } = useThemedAlert();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ mood: null, weather: null, tag: null });
  const [showOnboarding, setShowOnboarding] = useState(() => !getOnboardingDone());
  const [onboardingStep, setOnboardingStep] = useState(0);

  const thisDayEntries = useMemo(() => {
    return getThisDayLastYearEntries();
  }, [getThisDayLastYearEntries]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    state.entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [state.entries]);

  const hasActiveFilters = filters.mood || filters.weather || filters.tag;
  const shouldShowFilters = showFilters || !!hasActiveFilters;

  const filteredEntries = useMemo(() => {
    let entries = state.entries;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(entry => 
        entry.content.toLowerCase().includes(query) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (filters.mood) {
      entries = entries.filter(entry => entry.mood === filters.mood);
    }
    
    if (filters.weather) {
      entries = entries.filter(entry => entry.weather === filters.weather);
    }
    
    if (filters.tag) {
      entries = entries.filter(entry => entry.tags?.includes(filters.tag!));
    }
    
    return entries;
  }, [state.entries, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({ mood: null, weather: null, tag: null });
  };

  const onboardingSteps = useMemo(() => ([
    {
      title: '隐私承诺',
      description: '所有日记只保存在本地设备，不上传服务器。请放心记录真实的自己。',
      actionLabel: null as string | null,
      action: null as (() => void) | null,
    },
    {
      title: '设置应用锁',
      description: '建议开启 PIN + 生物识别，防止他人查看你的日记。',
      actionLabel: '去设置',
      action: () => {
        setOnboardingDone(true);
        setShowOnboarding(false);
        navigation.navigate('Settings', { open: 'appLock' });
      },
    },
    {
      title: '个性化体验',
      description: '选择喜欢的主题配色，并设置每天的写作提醒。',
      actionLabel: '设置主题/提醒',
      action: () => {
        setOnboardingDone(true);
        setShowOnboarding(false);
        navigation.navigate('Settings', { open: 'theme' });
      },
    },
  ]), [navigation]);

  const completeOnboarding = () => {
    setOnboardingDone(true);
    setShowOnboarding(false);
  };

  const handleCardPress = useCallback((entry: DiaryEntry) => {
    navigation.navigate('DiaryDetail', { entryId: entry.id });
  }, [navigation]);

  const handleCardLongPress = useCallback((entry: DiaryEntry) => {
    showAlert(
      entry.content.substring(0, 20) + (entry.content.length > 20 ? '...' : ''),
      '选择操作',
      [
        { text: '取消', style: 'cancel' },
        { text: '编辑', onPress: () => navigation.navigate('Editor', { entryId: entry.id }) },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => {
            showAlert('确认删除', '确定要删除这篇日记吗？', [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => deleteEntry(entry.id) },
            ]);
          }
        },
      ]
    );
  }, [navigation, deleteEntry]);

  const renderThisDaySection = () => {
    if (thisDayEntries.length === 0) return null;

    const latestEntry = thisDayEntries[0];
    const year = new Date(latestEntry.date).getFullYear();

    return (
      <TouchableOpacity 
        style={[styles.thisDayCard, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}
        onPress={() => handleCardPress(latestEntry)}
        activeOpacity={0.7}
      >
        <View style={styles.thisDayHeader}>
          <Feather name="clock" size={18} color={colors.primary} />
          <Text style={[styles.thisDayTitle, { color: colors.primary }]}>那年今日</Text>
          <Text style={[styles.thisDayYear, { color: colors.textSecondary }]}>{year}年</Text>
        </View>
        <Text style={[styles.thisDayContent, { color: colors.textPrimary }]} numberOfLines={2}>
          {latestEntry.content}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.cardBackground }]}>
        <Feather name="book-open" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>开始记录你的轨迹</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        记录每一个珍贵的瞬间{'\n'}让回忆在这里生根发芽
      </Text>
      <TouchableOpacity 
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Editor', {})}
      >
        <Text style={styles.emptyButtonText}>写下第一篇日记</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = useCallback(({ item }: { item: DiaryEntry }) => (
    <DiaryCard 
      entry={item} 
      onPress={() => handleCardPress(item)} 
      onLongPress={() => handleCardLongPress(item)}
    />
  ), [handleCardPress, handleCardLongPress]);

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>心情:</Text>
        {MOOD_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.emoji}
            style={[
              styles.filterChip,
              { backgroundColor: filters.mood === option.emoji ? colors.primary : colors.cardBackground }
            ]}
            onPress={() => setFilters(f => ({ ...f, mood: f.mood === option.emoji ? null : option.emoji }))}
          >
            <Text style={styles.filterChipEmoji}>{option.emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>天气:</Text>
        {WEATHER_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterChip,
              { backgroundColor: filters.weather === option.id ? colors.primary : colors.cardBackground }
            ]}
            onPress={() => setFilters(f => ({ ...f, weather: f.weather === option.id ? null : option.id }))}
          >
            <Feather 
              name={option.icon as any} 
              size={16} 
              color={filters.weather === option.id ? '#FFF' : colors.textPrimary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {allTags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>标签:</Text>
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterChip,
                styles.filterChipTag,
                { backgroundColor: filters.tag === tag ? colors.primary : colors.cardBackground }
              ]}
              onPress={() => setFilters(f => ({ ...f, tag: f.tag === tag ? null : tag }))}
            >
              <Text style={[styles.filterChipText, { color: filters.tag === tag ? '#FFF' : colors.textPrimary }]}>
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {hasActiveFilters && (
        <TouchableOpacity style={styles.clearFilters} onPress={clearFilters}>
          <Feather name="x-circle" size={14} color={colors.error} />
          <Text style={[styles.clearFiltersText, { color: colors.error }]}>清除筛选</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const keyExtractor = useCallback((item: DiaryEntry) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>素履</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDateDisplay(new Date())}</Text>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
          <Feather name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="搜索日记内容..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.searchCloseButton}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: hasActiveFilters ? colors.primary : colors.cardBackground }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather name="filter" size={20} color={hasActiveFilters ? '#FFF' : colors.textPrimary} />
        </TouchableOpacity>
      </View>
      {shouldShowFilters && renderFilters()}

      {state.entries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={!searchQuery && !hasActiveFilters ? renderThisDaySection : null}
          ListEmptyComponent={
            searchQuery || hasActiveFilters ? (
              <View style={styles.noResultContainer}>
                <Text style={[styles.noResultText, { color: colors.textMuted }]}>未找到相关日记</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showOnboarding} animationType="slide" transparent onRequestClose={completeOnboarding}>
        <View style={styles.onboardingOverlay}>
          <View style={[styles.onboardingCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.onboardingHeader}>
              <Text style={[styles.onboardingTitle, { color: colors.textPrimary }]}>新手引导</Text>
              <TouchableOpacity onPress={completeOnboarding}>
                <Text style={[styles.onboardingSkip, { color: colors.textSecondary }]}>跳过</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.onboardingProgress}>
              {onboardingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.onboardingDot,
                    { backgroundColor: index === onboardingStep ? colors.primary : colors.divider },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.onboardingStepTitle, { color: colors.textPrimary }]}>
              {onboardingSteps[onboardingStep].title}
            </Text>
            <Text style={[styles.onboardingStepDesc, { color: colors.textSecondary }]}>
              {onboardingSteps[onboardingStep].description}
            </Text>
            {onboardingSteps[onboardingStep].action && onboardingSteps[onboardingStep].actionLabel && (
              <TouchableOpacity
                style={[styles.onboardingAction, { backgroundColor: colors.primary }]}
                onPress={onboardingSteps[onboardingStep].action!}
              >
                <Text style={styles.onboardingActionText}>{onboardingSteps[onboardingStep].actionLabel}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.onboardingFooter}>
              <TouchableOpacity
                style={[styles.onboardingNavButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => setOnboardingStep((prev) => Math.max(prev - 1, 0))}
                disabled={onboardingStep === 0}
              >
                <Text style={[styles.onboardingNavText, { color: colors.textSecondary }]}>上一步</Text>
              </TouchableOpacity>
              {onboardingStep < onboardingSteps.length - 1 ? (
                <TouchableOpacity
                  style={[styles.onboardingNavButton, { backgroundColor: colors.primary }]}
                  onPress={() => setOnboardingStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1))}
                >
                  <Text style={styles.onboardingNavTextPrimary}>下一步</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.onboardingNavButton, { backgroundColor: colors.primary }]}
                  onPress={completeOnboarding}
                >
                  <Text style={styles.onboardingNavTextPrimary}>完成</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {Platform.OS === 'android' && (
        <ThemedAlert
          visible={!!alertConfig}
          title={alertConfig?.title}
          message={alertConfig?.message}
          actions={alertConfig?.actions}
          onClose={hideAlert}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: Layout.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  searchCloseButton: {
    padding: Layout.spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingBottom: Layout.spacing.sm,
    gap: Layout.spacing.xs,
  },
  filtersScroll: {
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  filterLabel: {
    fontSize: 12,
    marginRight: Layout.spacing.xs,
  },
  filterChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipTag: {
    width: 'auto',
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  filterChipEmoji: {
    fontSize: 18,
  },
  filterChipText: {
    fontSize: 12,
  },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xs,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
  },
  noResultContainer: {
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 100,
  },
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  onboardingCard: {
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xl,
  },
  onboardingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  onboardingSkip: {
    fontSize: 14,
  },
  onboardingProgress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Layout.spacing.md,
  },
  onboardingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onboardingStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  onboardingStepDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  onboardingAction: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  onboardingActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  onboardingFooter: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  onboardingNavButton: {
    flex: 1,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  onboardingNavText: {
    fontSize: 14,
    fontWeight: '600',
  },
  onboardingNavTextPrimary: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  thisDayCard: {
    marginHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.sm,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    borderLeftWidth: 4,
  },
  thisDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  thisDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Layout.spacing.sm,
  },
  thisDayYear: {
    fontSize: 12,
    marginLeft: Layout.spacing.sm,
  },
  thisDayContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
