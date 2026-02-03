import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  StatusBar,
  Platform,
  Switch,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import JSZip from 'jszip';
import { SettingsItem, PinInput, MoodChart } from '../components';
import { useDiary, useAuth } from '../context';
import { useTheme } from '../context/ThemeProvider';
import { Layout } from '../constants';
import { ExportData } from '../types';
import { isValidPinFormat } from '../utils/cryptoUtils';
import { readImageAsBase64, writeImageFromBase64 } from '../utils/imageStorage';
import { getStorage, getImageCompression, setImageCompression } from '../api/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('diary-reminder', {
      name: '日记提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5B8C5A',
      sound: 'default',
    });
  }
};

type PinModalMode = 'setup' | 'confirm' | 'disable' | null;

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const STORAGE_KEYS = {
  REMINDER_SETTINGS: 'reminder_settings',
};

export function SettingsScreen() {
  const { exportEntries, importEntries, state: diaryState } = useDiary();
  const { state: authState, enableAppLock, disableAppLock, authenticateWithPin } = useAuth();
  const { colors, theme, setTheme, availableThemes, colorMode, setColorMode, isDark } = useTheme();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>(null);
  const [tempPin, setTempPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [imageCompressionEnabled, setImageCompressionEnabled] = useState(() => getImageCompression());

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    const saved = getStorage().getString(STORAGE_KEYS.REMINDER_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { enabled: false, hour: 21, minute: 0 };
  });
  const [tempHour, setTempHour] = useState(reminderSettings.hour.toString());
  const [tempMinute, setTempMinute] = useState(reminderSettings.minute.toString().padStart(2, '0'));

  const streakInfo = useMemo(() => {
    if (diaryState.entries.length === 0) return { current: 0, longest: 0, total: 0 };

    const sortedEntries = [...diaryState.entries].sort((a, b) => b.date - a.date);
    const entryDates = new Set(sortedEntries.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let checkDate = new Date(today);

    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    if (!entryDates.has(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (entryDates.has(key)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const allDates = Array.from(entryDates).map(key => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d).getTime();
    }).sort((a, b) => a - b);

    for (let i = 0; i < allDates.length; i++) {
      if (i === 0 || allDates[i] - allDates[i - 1] === 86400000) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { current: currentStreak, longest: longestStreak, total: entryDates.size };
  }, [diaryState.entries]);

  const totalWords = useMemo(() => {
    return diaryState.entries.reduce((sum, e) => sum + (e.wordCount || 0), 0);
  }, [diaryState.entries]);

  useEffect(() => {
    (async () => {
      await setupNotificationChannel();
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted' && reminderSettings.enabled) {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          setReminderSettings(prev => ({ ...prev, enabled: false }));
          getStorage().set(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify({ ...reminderSettings, enabled: false }));
        }
      }
    })();
  }, []);

  const scheduleReminder = async (settings: ReminderSettings) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    if (!settings.enabled) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        Alert.alert('权限提示', '需要通知权限才能设置日记提醒');
        return false;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '素履',
        body: '今天还没有写日记哦，记录一下今天的心情吧！',
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'diary-reminder' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
      },
    });
    return true;
  };

  const handleReminderToggle = async (enabled: boolean) => {
    const newSettings = { ...reminderSettings, enabled };
    const success = await scheduleReminder(newSettings);
    if (success !== false) {
      setReminderSettings(newSettings);
      getStorage().set(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(newSettings));
    }
  };

  const handleSaveReminder = async () => {
    const hour = parseInt(tempHour, 10);
    const minute = parseInt(tempMinute, 10);
    
    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(minute) || minute < 0 || minute > 59) {
      Alert.alert('错误', '请输入有效的时间');
      return;
    }

    const newSettings = { ...reminderSettings, hour, minute };
    await scheduleReminder(newSettings);
    setReminderSettings(newSettings);
    getStorage().set(STORAGE_KEYS.REMINDER_SETTINGS, JSON.stringify(newSettings));
    setReminderModalVisible(false);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = exportEntries();
      const zip = new JSZip();
      
      zip.file('data.json', JSON.stringify(data, null, 2));
      
      const imagesFolder = zip.folder('images');
      if (imagesFolder) {
        for (const entry of data.entries) {
          if (entry.images && entry.images.length > 0) {
            for (const fileName of entry.images) {
              const base64 = await readImageAsBase64(fileName);
              if (base64) {
                imagesFolder.file(fileName, base64, { base64: true });
              }
            }
          }
        }
      }

      const zipContent = await zip.generateAsync({ type: 'base64' });
      const fileName = `trace-backup-${new Date().toISOString().split('T')[0]}.zip`;
      
      if (!cacheDirectory) {
        Alert.alert('错误', '无法访问缓存目录');
        setIsExporting(false);
        return;
      }
      
      const filePath = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(filePath, zipContent, { encoding: EncodingType.Base64 });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/zip',
          dialogTitle: '导出日记数据',
        });
      } else {
        Alert.alert('错误', '分享功能不可用');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '导出数据时发生错误');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/zip',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setIsImporting(true);
      const file = result.assets[0];
      const zipContent = await readAsStringAsync(file.uri, { encoding: EncodingType.Base64 });
      const zip = await JSZip.loadAsync(zipContent, { base64: true });
      
      const dataFile = zip.file('data.json');
      if (!dataFile) {
        Alert.alert('错误', '无效的备份文件格式');
        setIsImporting(false);
        return;
      }

      const jsonContent = await dataFile.async('string');
      const data: ExportData = JSON.parse(jsonContent);

      if (!data.entries || !Array.isArray(data.entries)) {
        Alert.alert('错误', '无效的备份文件格式');
        setIsImporting(false);
        return;
      }

      const imagesFolder = zip.folder('images');
      const imageFiles = imagesFolder ? Object.keys(imagesFolder.files).filter(name => name.startsWith('images/') && !name.endsWith('/')) : [];
      const imageCount = imageFiles.length;

      const importImages = async () => {
        if (imagesFolder) {
          for (const filePath of imageFiles) {
            const fileName = filePath.replace('images/', '');
            const imgFile = zip.file(filePath);
            if (imgFile) {
              const base64 = await imgFile.async('base64');
              await writeImageFromBase64(fileName, base64);
            }
          }
        }
      };

      const message = imageCount > 0 
        ? `发现 ${data.entries.length} 条日记和 ${imageCount} 张图片。请选择导入方式：`
        : `发现 ${data.entries.length} 条日记记录。请选择导入方式：`;

      Alert.alert(
        '导入数据',
        message,
        [
          { text: '取消', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: '合并',
            onPress: async () => {
              await importImages();
              importEntries(data, 'merge');
              setIsImporting(false);
              Alert.alert('成功', '数据已合并导入');
            },
          },
          {
            text: '覆盖',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                '警告',
                '覆盖将删除所有现有数据，确定继续吗？',
                [
                  { text: '取消', style: 'cancel', onPress: () => setIsImporting(false) },
                  {
                    text: '确定覆盖',
                    style: 'destructive',
                    onPress: async () => {
                      await importImages();
                      importEntries(data, 'overwrite');
                      setIsImporting(false);
                      Alert.alert('成功', '数据已覆盖导入');
                    },
                  },
                ]
              );
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('导入失败', '请确保选择了有效的备份文件');
      setIsImporting(false);
    }
  };

  const handleAppLockToggle = (value: boolean) => {
    if (value) {
      setPinModalMode('setup');
      setPinModalVisible(true);
    } else {
      setPinModalMode('disable');
      setPinModalVisible(true);
    }
  };

  const handlePinComplete = useCallback((pin: string) => {
    switch (pinModalMode) {
      case 'setup':
        if (!isValidPinFormat(pin)) {
          setPinError('请输入 4-6 位数字');
          return;
        }
        setTempPin(pin);
        setPinModalMode('confirm');
        setPinError('');
        break;

      case 'confirm':
        if (pin !== tempPin) {
          setPinError('两次输入的 PIN 码不一致');
          return;
        }
        enableAppLock(pin);
        setPinModalVisible(false);
        setPinModalMode(null);
        setTempPin('');
        Alert.alert('成功', '应用锁已启用');
        break;

      case 'disable':
        const success = authenticateWithPin(pin);
        if (success) {
          disableAppLock();
          setPinModalVisible(false);
          setPinModalMode(null);
          Alert.alert('成功', '应用锁已禁用');
        } else {
          setPinError('PIN 码错误');
        }
        break;
    }
  }, [pinModalMode, tempPin, enableAppLock, disableAppLock, authenticateWithPin]);

  const closePinModal = () => {
    setPinModalVisible(false);
    setPinModalMode(null);
    setTempPin('');
    setPinError('');
  };

  const getPinModalTitle = () => {
    switch (pinModalMode) {
      case 'setup': return '设置 PIN 码';
      case 'confirm': return '确认 PIN 码';
      case 'disable': return '输入当前 PIN 码';
      default: return '';
    }
  };

  const getPinModalSubtitle = () => {
    switch (pinModalMode) {
      case 'setup': return '请设置 4-6 位数字 PIN 码\n⚠️ 忘记密码将无法恢复数据';
      case 'confirm': return '请再次输入 PIN 码确认';
      case 'disable': return '请输入当前 PIN 码以禁用应用锁';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>设置</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>写作统计</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{streakInfo.current}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>连续天数</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{streakInfo.longest}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>最长连续</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{streakInfo.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>总天数</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalWords}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>总字数</Text>
            </View>
          </View>
        </View>

        <MoodChart entries={diaryState.entries} days={7} />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>外观</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="palette"
            title="主题配色"
            subtitle={theme.name}
            onPress={() => setThemeModalVisible(true)}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.colorModeContainer}>
            <View style={styles.colorModeHeader}>
              <Feather name={isDark ? 'moon' : 'sun'} size={20} color={colors.primary} />
              <Text style={[styles.colorModeTitle, { color: colors.textPrimary }]}>显示模式</Text>
            </View>
            <View style={styles.colorModeOptions}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.colorModeOption,
                    { backgroundColor: colorMode === mode ? colors.primary : colors.inputBackground }
                  ]}
                  onPress={() => setColorMode(mode)}
                >
                  <Feather 
                    name={mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'smartphone'} 
                    size={16} 
                    color={colorMode === mode ? '#FFF' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.colorModeLabel,
                    { color: colorMode === mode ? '#FFF' : colors.textSecondary }
                  ]}>
                    {mode === 'light' ? '浅色' : mode === 'dark' ? '深色' : '跟随系统'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>提醒</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="bell"
            title="日记提醒"
            subtitle={reminderSettings.enabled 
              ? `每天 ${reminderSettings.hour.toString().padStart(2, '0')}:${reminderSettings.minute.toString().padStart(2, '0')}` 
              : '关闭'}
            hasSwitch
            switchValue={reminderSettings.enabled}
            onSwitchChange={handleReminderToggle}
          />
          {reminderSettings.enabled && (
            <SettingsItem
              icon="clock"
              title="提醒时间"
              subtitle={`${reminderSettings.hour.toString().padStart(2, '0')}:${reminderSettings.minute.toString().padStart(2, '0')}`}
              onPress={() => {
                setTempHour(reminderSettings.hour.toString());
                setTempMinute(reminderSettings.minute.toString().padStart(2, '0'));
                setReminderModalVisible(true);
              }}
            />
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>安全</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="lock"
            title="应用锁"
            subtitle={authState.isAppLockEnabled ? '已启用' : '保护您的隐私'}
            hasSwitch
            switchValue={authState.isAppLockEnabled}
            onSwitchChange={handleAppLockToggle}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>图片</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="image"
            title="图片压缩"
            subtitle={imageCompressionEnabled ? '压缩至1080px宽度，节省存储空间' : '保存原图，占用更多空间'}
            hasSwitch
            switchValue={imageCompressionEnabled}
            onSwitchChange={(value) => {
              setImageCompressionEnabled(value);
              setImageCompression(value);
            }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>数据</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="download"
            title="导出日记"
            subtitle={isExporting ? '导出中...' : `共 ${diaryState.entries.length} 条记录`}
            onPress={isExporting ? undefined : handleExport}
            rightElement={isExporting ? <ActivityIndicator size="small" color={colors.primary} /> : undefined}
          />
          <SettingsItem
            icon="upload"
            title="导入日记"
            subtitle={isImporting ? '导入中...' : '从备份文件恢复'}
            onPress={isImporting ? undefined : handleImport}
            rightElement={isImporting ? <ActivityIndicator size="small" color={colors.primary} /> : undefined}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>关于</Text>
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <SettingsItem
            icon="info"
            title="版本"
            subtitle="1.0.0"
            onPress={() => {}}
          />
          <SettingsItem
            icon="heart"
            title="关于素履"
            subtitle="记录人生轨迹，素雅且纯粹"
            onPress={() => setAboutModalVisible(true)}
          />
        </View>
      </ScrollView>

      <Modal visible={pinModalVisible} animationType="slide" onRequestClose={closePinModal}>
        <SafeAreaView style={[styles.pinModalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.pinModalHeader}>
            <TouchableOpacity onPress={closePinModal} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>取消</Text>
            </TouchableOpacity>
          </View>
          <PinInput
            onComplete={handlePinComplete}
            title={getPinModalTitle()}
            subtitle={getPinModalSubtitle()}
            error={pinError}
          />
        </SafeAreaView>
      </Modal>

      <Modal visible={themeModalVisible} animationType="slide" transparent onRequestClose={() => setThemeModalVisible(false)}>
        <View style={styles.themeModalOverlay}>
          <View style={[styles.themeModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeModalHeader}>
              <Text style={[styles.themeModalTitle, { color: colors.textPrimary }]}>选择主题</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.themeGrid}>
              {availableThemes.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themeItem,
                    { borderColor: theme.id === t.id ? t.colors.primary : colors.border },
                    theme.id === t.id && styles.themeItemActive,
                  ]}
                  onPress={() => { setTheme(t.id); setThemeModalVisible(false); }}
                >
                  <View style={[styles.themePreview, { backgroundColor: t.colors.background }]}>
                    <View style={[styles.themePreviewCard, { backgroundColor: t.colors.cardBackground }]}>
                      <View style={[styles.themePreviewDot, { backgroundColor: t.colors.primary }]} />
                    </View>
                  </View>
                  <Text style={[styles.themeName, { color: colors.textPrimary }]}>{t.name}</Text>
                  {theme.id === t.id && (
                    <View style={[styles.themeCheck, { backgroundColor: t.colors.primary }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={reminderModalVisible} animationType="slide" transparent onRequestClose={() => setReminderModalVisible(false)}>
        <KeyboardAvoidingView 
          style={styles.themeModalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={() => setReminderModalVisible(false)} 
          />
          <View style={[styles.themeModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.themeModalHeader}>
              <Text style={[styles.themeModalTitle, { color: colors.textPrimary }]}>设置提醒时间</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.timeInputRow}>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                value={tempHour}
                onChangeText={setTempHour}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="时"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.timeColon, { color: colors.textPrimary }]}>:</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                value={tempMinute}
                onChangeText={setTempMinute}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="分"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSaveReminder}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={aboutModalVisible} animationType="fade" transparent onRequestClose={() => setAboutModalVisible(false)}>
        <View style={styles.themeModalOverlay}>
          <View style={[styles.aboutModalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.aboutHeader}>
              <View style={[styles.aboutIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Feather name="feather" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>素履</Text>
              <Text style={[styles.aboutSubtitle, { color: colors.textSecondary }]}>Trace</Text>
              <Text style={[styles.aboutSlogan, { color: colors.textSecondary }]}>记录人生轨迹，素雅且纯粹</Text>
            </View>
            
            <Text style={[styles.aboutDescription, { color: colors.textPrimary }]}>
              一个以绝对隐私为基石的日记应用。{'\n'}所有数据均存储在本地，不会上传至任何服务器。
            </Text>

            <View style={[styles.aboutDivider, { backgroundColor: colors.border }]} />

            <Text style={[styles.aboutSectionTitle, { color: colors.textSecondary }]}>开发者</Text>
            
            <TouchableOpacity 
              style={[styles.aboutContactItem, { backgroundColor: colors.background }]}
              onPress={() => Linking.openURL('mqqwpa://im/chat?chat_type=wpa&uin=1075047189')}
            >
              <View style={[styles.aboutContactIcon, { backgroundColor: '#12B7F5' + '20' }]}>
                <Text style={{ fontSize: 18 }}>Q</Text>
              </View>
              <View style={styles.aboutContactInfo}>
                <Text style={[styles.aboutContactLabel, { color: colors.textSecondary }]}>QQ</Text>
                <Text style={[styles.aboutContactValue, { color: colors.textPrimary }]}>1075047189</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.aboutContactItem, { backgroundColor: colors.background }]}
              onPress={() => Linking.openURL('https://space.bilibili.com')}
            >
              <View style={[styles.aboutContactIcon, { backgroundColor: '#FB7299' + '20' }]}>
                <Text style={{ fontSize: 18 }}>B</Text>
              </View>
              <View style={styles.aboutContactInfo}>
                <Text style={[styles.aboutContactLabel, { color: colors.textSecondary }]}>哔哩哔哩</Text>
                <Text style={[styles.aboutContactValue, { color: colors.textPrimary }]}>格鲁德沙皇</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.aboutCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={styles.aboutCloseButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.md },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout.spacing.md, paddingBottom: 100 },
  statsCard: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: Layout.spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: { borderRadius: Layout.borderRadius.lg, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: Layout.spacing.md },
  colorModeContainer: { padding: Layout.spacing.md },
  colorModeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.spacing.sm, gap: Layout.spacing.sm },
  colorModeTitle: { fontSize: 16 },
  colorModeOptions: { flexDirection: 'row', gap: Layout.spacing.sm },
  colorModeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Layout.spacing.sm, borderRadius: Layout.borderRadius.md, gap: 6 },
  colorModeLabel: { fontSize: 13 },
  pinModalContainer: { flex: 1 },
  pinModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  closeButton: { padding: Layout.spacing.sm },
  closeButtonText: { fontSize: 16 },
  themeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  themeModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Layout.spacing.lg,
    paddingBottom: 40,
  },
  themeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  themeModalTitle: { fontSize: 18, fontWeight: '600' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeItem: {
    width: '30%',
    aspectRatio: 0.9,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
  },
  themeItemActive: { borderWidth: 2 },
  themePreview: {
    width: '100%',
    flex: 1,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewCard: { width: '60%', height: '50%', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  themePreviewDot: { width: 16, height: 16, borderRadius: 8 },
  themeName: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Layout.spacing.lg,
  },
  timeInput: {
    width: 80,
    height: 60,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    borderRadius: Layout.borderRadius.md,
  },
  timeColon: { fontSize: 32, fontWeight: '600', marginHorizontal: Layout.spacing.sm },
  saveButton: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  aboutModalContent: {
    margin: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  aboutIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  aboutSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  aboutSlogan: {
    fontSize: 13,
    marginTop: Layout.spacing.sm,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  aboutDivider: {
    height: 1,
    marginVertical: Layout.spacing.lg,
  },
  aboutSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
    textTransform: 'uppercase',
  },
  aboutContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.sm,
  },
  aboutContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  aboutContactInfo: {
    flex: 1,
  },
  aboutContactLabel: {
    fontSize: 12,
  },
  aboutContactValue: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  aboutCloseButton: {
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  aboutCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
