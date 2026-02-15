import React, { useCallback, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useDiary } from '../context';
import { useTheme } from '../context/ThemeProvider';
import { Colors, Layout, Typography, WEATHER_OPTIONS } from '../constants';
import { RootStackParamList } from '../types';
import { formatDateDisplay, formatWeekday } from '../utils/dateUtils';
import { getImageUri } from '../utils/imageStorage';
import { getEntryImages } from '../utils/entryUtils';
import { MarkdownPreview, ThemedAlert } from '../components';
import { useThemedAlert } from '../hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ uri }: { uri: string }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(1);
  const lastState = useRef<number>(State.UNDETERMINED);

  const onPinchEvent = Animated.event<PinchGestureHandlerGestureEvent>(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: PinchGestureHandlerGestureEvent) => {
    if (lastState.current === State.ACTIVE && event.nativeEvent.state !== State.ACTIVE) {
      const newScale = baseScale.current * event.nativeEvent.scale;
      baseScale.current = Math.min(Math.max(newScale, 1), 4);
      scale.setValue(baseScale.current);
    }
    lastState.current = event.nativeEvent.state;
  };

  return (
    <PinchGestureHandler
      onGestureEvent={onPinchEvent}
      onHandlerStateChange={onPinchStateChange}
    >
      <Animated.Image
        source={{ uri }}
        style={[styles.fullImage, { transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </PinchGestureHandler>
  );
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DiaryDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'DiaryDetail'>;

export function DiaryDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { getEntryById, deleteEntry } = useDiary();
  const { colors, isDark } = useTheme();
  const { showAlert, alertConfig, hideAlert } = useThemedAlert();
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMarkdown, setShowMarkdown] = useState(true);
  const viewShotRef = useRef<ViewShot>(null);

  const entry = getEntryById(route.params.entryId);

  const handleExportAsImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('权限提示', '需要存储权限才能保存图片');
        return;
      }

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        const asset = await MediaLibrary.createAssetAsync(uri);
        
        showAlert('导出成功', '日记已保存为图片', [
          { text: '好的' },
          { 
            text: '分享', 
            onPress: async () => {
              const isAvailable = await Sharing.isAvailableAsync();
              if (isAvailable) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png' });
              }
            }
          },
        ]);
      }
    } catch (error) {
      console.error('Export as image error:', error);
      showAlert('导出失败', '导出图片时发生错误');
    }
  };
  const weatherOption = WEATHER_OPTIONS.find((w) => w.id === entry?.weather);
  const entryImages = entry ? getEntryImages(entry) : [];

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  const handleEdit = useCallback(() => {
    if (entry) {
      navigation.navigate('Editor', { entryId: entry.id });
    }
  }, [navigation, entry]);

  const handleDelete = useCallback(() => {
    showAlert(
      '删除日记',
      '确定要删除这篇日记吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            if (entry) {
              deleteEntry(entry.id);
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [deleteEntry, entry, navigation]);

  if (!entry) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>日记不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.cardBackground} />
      
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerButton, { backgroundColor: colors.inputBackground }]}>
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowMarkdown(!showMarkdown)} style={[styles.headerButton, { backgroundColor: colors.inputBackground }]}>
            <Feather name={showMarkdown ? 'eye' : 'eye-off'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportAsImage} style={[styles.headerButton, { backgroundColor: colors.inputBackground }]}>
            <Feather name="image" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit} style={[styles.headerButton, { backgroundColor: colors.inputBackground }]}>
            <Feather name="edit-2" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.headerButton, { backgroundColor: colors.error + '12' }]}>
            <Feather name="trash-2" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewShotHidden} collapsable={false}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <View style={[styles.exportContainer, { backgroundColor: colors.cardBackground, padding: Layout.spacing.md }]}>
            <View style={styles.metaSection}>
              <View style={styles.dateRow}>
                {entry.mood && <Text style={styles.mood}>{entry.mood}</Text>}
                <View style={styles.dateInfo}>
                  <Text style={[styles.date, { color: colors.textPrimary }]}>{formatDateDisplay(entry.date)}</Text>
                  <Text style={[styles.weekday, { color: colors.textSecondary }]}>{formatWeekday(entry.date)}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                {weatherOption && (
                  <View style={styles.metaItem}>
                    <Feather 
                      name={weatherOption.icon as any} 
                      size={16} 
                      color={Colors.weatherColors[entry.weather as keyof typeof Colors.weatherColors]} 
                    />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{weatherOption.label}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Feather name="edit-3" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{entry.wordCount} 字</Text>
                </View>
                {entryImages.length > 0 && (
                  <View style={styles.metaItem}>
                    <Feather name="image" size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{entryImages.length} 张图片</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.contentSection}>
              <MarkdownPreview content={entry.content} />
            </View>
            {entryImages.length > 0 && (
              <View style={styles.exportImagesSection}>
                <View style={styles.exportImagesGrid}>
                  {entryImages.map((img, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.exportImageWrapper,
                        entryImages.length === 1 && styles.exportSingleImage,
                        entryImages.length === 2 && styles.exportTwoImages,
                      ]}
                    >
                      <Image 
                        source={{ uri: getImageUri(img) }}
                        style={styles.exportImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={[styles.exportFooter, { borderTopColor: colors.divider }]}>
              <Text style={[styles.exportBrand, { color: colors.textMuted }]}>素履 · Trace</Text>
            </View>
          </View>
        </ViewShot>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.metaSection}>
          <View style={styles.dateRow}>
            {entry.mood && <Text style={styles.mood}>{entry.mood}</Text>}
            <View style={styles.dateInfo}>
              <Text style={[styles.date, { color: colors.textPrimary }]}>{formatDateDisplay(entry.date)}</Text>
              <Text style={[styles.weekday, { color: colors.textSecondary }]}>{formatWeekday(entry.date)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {weatherOption && (
              <View style={styles.metaItem}>
                <Feather 
                  name={weatherOption.icon as any} 
                  size={16} 
                  color={Colors.weatherColors[entry.weather as keyof typeof Colors.weatherColors]} 
                />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{weatherOption.label}</Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Feather name="edit-3" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{entry.wordCount} 字</Text>
            </View>
            {entryImages.length > 0 && (
              <View style={styles.metaItem}>
                <Feather name="image" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{entryImages.length} 张图片</Text>
              </View>
            )}
          </View>

          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {entry.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          {showMarkdown ? (
            <MarkdownPreview content={entry.content} />
          ) : (
            <Text style={[styles.contentText, { color: colors.textPrimary }]}>{entry.content}</Text>
          )}
        </View>

        {entryImages.length > 0 && (
          <View style={styles.imageSection}>
            <View style={styles.imagesGrid}>
              {entryImages.map((img, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.imageWrapper,
                    entryImages.length === 1 && styles.singleImageWrapper,
                    entryImages.length === 2 && styles.twoImageWrapper,
                  ]}
                  onPress={() => openImageViewer(index)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: getImageUri(img) }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <GestureHandlerRootView style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.closeViewerButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Feather name="x" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: selectedImageIndex * SCREEN_WIDTH, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIndex(newIndex);
            }}
          >
            {entryImages.map((img, index) => (
              <View key={index} style={styles.imageViewerPage}>
                <ZoomableImage uri={getImageUri(img)} />
              </View>
            ))}
          </ScrollView>
          {entryImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>{selectedImageIndex + 1} / {entryImages.length}</Text>
            </View>
          )}
        </GestureHandlerRootView>
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
  viewShotHidden: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: SCREEN_WIDTH,
    opacity: 0,
    pointerEvents: 'none',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.xs / 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.xxl,
  },
  metaSection: {
    marginBottom: Layout.spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  mood: {
    fontSize: Typography.fontSize['5xl'],
    marginRight: Layout.spacing.md,
  },
  dateInfo: {
    flex: 1,
  },
  date: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
  },
  weekday: {
    fontSize: Typography.fontSize.sm,
    marginTop: Layout.spacing.xs / 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.lg,
    marginBottom: Layout.spacing.xs / 2,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    marginLeft: 6,
  },
  contentSection: {
    marginBottom: Layout.spacing.lg,
  },
  contentText: {
    fontSize: Typography.fontSize.base,
    lineHeight: Math.round(Typography.fontSize.base * Typography.lineHeight.relaxed),
  },
  imageSection: {
    marginBottom: Layout.spacing.lg,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  imageWrapper: {
    width: '32.5%',
    aspectRatio: 1,
  },
  singleImageWrapper: {
    width: '100%',
    aspectRatio: 1.5,
  },
  twoImageWrapper: {
    width: '49%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.sm,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
  },
  closeViewerButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerPage: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
  },
  exportContainer: {
    padding: Layout.spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.sm,
  },
  tag: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs / 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  exportImagesSection: {
    marginBottom: Layout.spacing.md,
  },
  exportImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.xs - 2,
  },
  exportImageWrapper: {
    width: '32%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.sm,
    overflow: 'hidden',
  },
  exportSingleImage: {
    width: '100%',
    aspectRatio: 1.5,
  },
  exportTwoImages: {
    width: '49%',
  },
  exportImage: {
    width: '100%',
    height: '100%',
  },
  exportFooter: {
    paddingTop: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  exportBrand: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default DiaryDetailScreen;
