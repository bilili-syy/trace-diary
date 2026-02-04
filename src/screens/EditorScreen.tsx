import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TextInput, 
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { MoodPicker, WeatherPicker, TemplateModal, MarkdownPreview, ThemedAlert } from '../components';
import { useDiary } from '../context';
import { useTheme } from '../context/ThemeProvider';
import { useDebounce, useThemedAlert } from '../hooks';
import { Layout } from '../constants';
import { RootStackParamList, DiaryEntry, DiaryTemplate } from '../types';
import { formatDateId, formatDateDisplay, formatTime, countWords } from '../utils/dateUtils';
import { saveImage, deleteImages, getImageUri } from '../utils/imageStorage';
import { getEntryImages } from '../utils/entryUtils';
import { saveDraft, getDraft, clearDraft, getTagPresets } from '../api/storage';

const MAX_IMAGES = 9;

const WRITING_PROMPTS = [
  '今天最让你感到快乐的一件小事是什么？',
  '如果可以给今天的自己写一封信，你会说什么？',
  '描述一下今天遇到的一个有趣的人或事。',
  '今天学到了什么新东西？',
  '如果今天可以重来，你会做什么不同的选择？',
  '今天最想感谢的人是谁？为什么？',
  '描述一下今天的天气和你的心情之间的联系。',
  '今天有什么让你感到困扰的事情吗？',
  '分享一个今天让你微笑的瞬间。',
  '今天做了什么让自己感到骄傲的事？',
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Editor'>;
type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;

interface HistoryState {
  content: string;
  images: string[];
}

export function EditorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditorRouteProp>();
  const { state, getEntryById, addEntry, updateEntry, deleteEntry } = useDiary();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showAlert, alertConfig, hideAlert } = useThemedAlert();

  const entryId = route.params?.entryId;
  const dateParam = route.params?.date;
  const initialDate = dateParam || formatDateId(new Date());
  const [draftOnlyMode, setDraftOnlyMode] = useState(route.params?.draftOnly ?? false);
  
  const existingEntryById = entryId ? getEntryById(entryId) : null;
  const existingEntryByDate = !entryId ? getEntryById(initialDate) : null;
  const existingEntry = entryId
    ? existingEntryById
    : (draftOnlyMode ? null : existingEntryByDate);
  
  const isEditing = !!existingEntry && !draftOnlyMode;
  const diaryId = entryId || initialDate;

  const [content, setContent] = useState(existingEntry?.content || '');
  const [mood, setMood] = useState<string | undefined>(existingEntry?.mood);
  const [weather, setWeather] = useState<string | undefined>(existingEntry?.weather);
  const [images, setImages] = useState<string[]>(getEntryImages(existingEntry));
  const [tags, setTags] = useState<string[]>(existingEntry?.tags || []);
  const [templateUsed, setTemplateUsed] = useState<string | undefined>(existingEntry?.templateUsed);
  const [showTemplateModal, setShowTemplateModal] = useState(!isEditing && !content);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [writingMode, setWritingMode] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [tagPresets, setTagPresets] = useState<string[]>(() => getTagPresets());
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteImages, setPendingDeleteImages] = useState<string[]>([]);
  const pendingTemplateRef = useRef<DiaryTemplate | null>(null);
  const originalEntryRef = useRef<DiaryEntry | null>(existingEntry || null);
  
  const [dialogMode, setDialogMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<DiaryTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [dialogAnswers, setDialogAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const [history, setHistory] = useState<HistoryState[]>([{ content: existingEntry?.content || '', images: getEntryImages(existingEntry) }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  const presetTags = useMemo(() => {
    return tagPresets.filter((tag) => !tags.includes(tag));
  }, [tagPresets, tags]);

  const suggestedTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    state.entries.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .filter((tag) => !tags.includes(tag) && !tagPresets.includes(tag))
      .slice(0, 12);
  }, [state.entries, tags, tagPresets]);

  useEffect(() => {
    if (existingEntry) {
      originalEntryRef.current = existingEntry;
    }
  }, [existingEntry?.id]);


  useEffect(() => {
    if (draftChecked) return;
    
    const draft = getDraft();
    if (!draft || draft.diaryId !== diaryId) {
      setDraftChecked(true);
      return;
    }

    const timeDiff = Date.now() - draft.savedAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 24 || !draft.content.trim()) {
      clearDraft();
      setDraftChecked(true);
      return;
    }

    if (draftOnlyMode) {
      setContent(draft.content);
      if (draft.mood) setMood(draft.mood);
      if (draft.weather) setWeather(draft.weather);
      if (draft.images) setImages(draft.images);
      if (draft.tags) setTags(draft.tags);
      if (draft.templateUsed) setTemplateUsed(draft.templateUsed);
      setShowTemplateModal(false);
      clearDraft();
      setDraftChecked(true);
      return;
    }

    if (existingEntry) {
      showAlert(
        '发现草稿',
        '检测到同一天的草稿内容，是否合并到当前日记？',
        [
          { 
            text: '忽略', 
            style: 'cancel',
            onPress: () => {
              clearDraft();
              setDraftChecked(true);
            }
          },
          { 
            text: '替换', 
            style: 'destructive',
            onPress: () => {
              setContent(draft.content);
              if (draft.mood) setMood(draft.mood);
              if (draft.weather) setWeather(draft.weather);
              if (draft.images) setImages(draft.images);
              if (draft.tags) setTags(draft.tags);
              if (draft.templateUsed) setTemplateUsed(draft.templateUsed);
              setShowTemplateModal(false);
              setHasChanges(true);
              setHistory([{ content: draft.content, images: draft.images || [] }]);
              setHistoryIndex(0);
              clearDraft();
              setDraftChecked(true);
            }
          },
          { 
            text: '合并', 
            onPress: () => {
              const mergedContent = `${existingEntry.content}\n\n---\n\n${draft.content}`.trim();
              const mergedTags = Array.from(new Set([...(existingEntry.tags || []), ...(draft.tags || [])]));
              const mergedImages = [...(existingEntry.images || []), ...(draft.images || [])].slice(0, MAX_IMAGES);
              setContent(mergedContent);
              setTags(mergedTags);
              setImages(mergedImages);
              if (!existingEntry.mood && draft.mood) setMood(draft.mood);
              if (!existingEntry.weather && draft.weather) setWeather(draft.weather);
              if (!existingEntry.templateUsed && draft.templateUsed) setTemplateUsed(draft.templateUsed);
              setShowTemplateModal(false);
              setHasChanges(true);
              setHistory([{ content: mergedContent, images: mergedImages }]);
              setHistoryIndex(0);
              clearDraft();
              setDraftChecked(true);
            }
          },
        ]
      );
    } else {
      showAlert(
        '发现草稿',
        '是否恢复上次未保存的内容？',
        [
          { 
            text: '丢弃', 
            style: 'destructive',
            onPress: () => {
              clearDraft();
              setDraftChecked(true);
            }
          },
          { 
            text: '恢复', 
            onPress: () => {
              setContent(draft.content);
              if (draft.mood) setMood(draft.mood);
              if (draft.weather) setWeather(draft.weather);
              if (draft.images) setImages(draft.images);
              if (draft.tags) setTags(draft.tags);
              if (draft.templateUsed) setTemplateUsed(draft.templateUsed);
              setShowTemplateModal(false);
              clearDraft();
              setDraftChecked(true);
            }
          },
        ]
      );
    }
  }, [diaryId, existingEntry, draftChecked, draftOnlyMode]);

  useEffect(() => {
    if (showTagModal) {
      setTagPresets(getTagPresets());
    }
  }, [showTagModal]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveToHistory = useCallback((newContent: string, newImages: string[]) => {
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ content: newContent, images: newImages });
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, 500);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex].content);
      setImages(history[newIndex].images);
    }
  }, [canUndo, historyIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex].content);
      setImages(history[newIndex].images);
    }
  }, [canRedo, historyIndex, history]);

  const randomPrompt = useMemo(() => {
    return WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
  }, []);

  const debouncedSave = useDebounce((entry: DiaryEntry) => {
    if (isEditing) {
      updateEntry(entry);
    } else {
      addEntry(entry);
    }
  }, 1000);

  useEffect(() => {
    if (hasChanges && !draftOnlyMode) {
      const entry: DiaryEntry = {
        id: diaryId,
        date: existingEntry?.date || new Date(initialDate).getTime(),
        content,
        mood,
        weather,
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
        templateUsed,
        wordCount: countWords(content),
      };
      debouncedSave(entry);
    }
  }, [content, mood, weather, images, tags, hasChanges, templateUsed, diaryId, existingEntry?.date, initialDate, debouncedSave, draftOnlyMode]);

  const handleContentChange = (text: string) => {
    setContent(text);
    setHasChanges(true);
    saveToHistory(text, images);
  };

  const handleMoodSelect = (selectedMood: string) => {
    setMood(selectedMood === mood ? undefined : selectedMood);
    setHasChanges(true);
  };

  const handleWeatherSelect = (selectedWeather: string) => {
    setWeather(selectedWeather === weather ? undefined : selectedWeather);
    setHasChanges(true);
  };

  const applyTemplate = (template: DiaryTemplate) => {
    setTemplateUsed(template.id);
    setShowTemplateModal(false);
    
    if (template.id === 'free') {
      setContent('');
      setDialogMode(false);
    } else if (template.questions.length > 0) {
      setCurrentTemplate(template);
      setCurrentQuestionIndex(0);
      setDialogAnswers([]);
      setCurrentAnswer('');
      setDialogMode(true);
    }
    setHasChanges(true);
  };
  
  const handleDialogNext = () => {
    if (!currentTemplate) return;
    
    const answers = [...dialogAnswers, currentAnswer];
    setDialogAnswers(answers);
    
    if (currentQuestionIndex < currentTemplate.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      const formattedContent = currentTemplate.questions
        .map((q, i) => answers[i]?.trim() ? q.format(answers[i]) : '')
        .filter(Boolean)
        .join('\n\n');
      setContent(formattedContent);
      setDialogMode(false);
      setCurrentTemplate(null);
      setHasChanges(true);
    }
  };
  
  const handleDialogBack = () => {
    if (currentQuestionIndex > 0) {
      const prevAnswer = dialogAnswers[currentQuestionIndex - 1] || '';
      setCurrentAnswer(prevAnswer);
      setDialogAnswers(dialogAnswers.slice(0, -1));
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleDialogSkip = () => {
    if (!currentTemplate) return;
    
    const answers = [...dialogAnswers, ''];
    setDialogAnswers(answers);
    
    if (currentQuestionIndex < currentTemplate.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      const formattedContent = currentTemplate.questions
        .map((q, i) => answers[i]?.trim() ? q.format(answers[i]) : '')
        .filter(Boolean)
        .join('\n\n');
      setContent(formattedContent);
      setDialogMode(false);
      setCurrentTemplate(null);
      setHasChanges(true);
    }
  };
  
  const exitDialogMode = () => {
    showAlert('退出引导', '确定要退出模板引导吗？已回答的内容将保留。', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        onPress: () => {
          if (currentTemplate) {
            const allAnswers = [...dialogAnswers, currentAnswer];
            const formattedContent = currentTemplate.questions
              .map((q, i) => allAnswers[i]?.trim() ? q.format(allAnswers[i]) : '')
              .filter(Boolean)
              .join('\n\n');
            setContent(formattedContent);
          }
          setDialogMode(false);
          setCurrentTemplate(null);
          setHasChanges(true);
        },
      },
    ]);
  };

  const handleTemplateSelect = (template: DiaryTemplate) => {
    if (content.trim() && content.trim() !== existingEntry?.content?.trim()) {
      pendingTemplateRef.current = template;
      showAlert(
        '切换模板',
        '切换模板会清除当前内容，确定要继续吗？',
        [
          { text: '取消', style: 'cancel', onPress: () => { pendingTemplateRef.current = null; } },
          { 
            text: '确定', 
            style: 'destructive',
            onPress: () => {
              if (pendingTemplateRef.current) {
                applyTemplate(pendingTemplateRef.current);
                pendingTemplateRef.current = null;
              }
            }
          },
        ]
      );
    } else {
      applyTemplate(template);
    }
  };

  const pickFromLibrary = async () => {
    if (images.length >= MAX_IMAGES) {
      showAlert('提示', `最多只能添加 ${MAX_IMAGES} 张图片`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('权限提示', '需要访问相册权限才能添加图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_IMAGES - images.length,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsSaving(true);
        const newImages: string[] = [];
        for (let i = 0; i < result.assets.length; i++) {
          const fileName = await saveImage(result.assets[i].uri, diaryId, images.length + i);
          if (fileName) newImages.push(fileName);
        }
        if (newImages.length > 0) {
          const updatedImages = [...images, ...newImages].slice(0, MAX_IMAGES);
          setImages(updatedImages);
          setHasChanges(true);
          saveToHistory(content, updatedImages);
        }
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('错误', '选择图片时出错');
      setIsSaving(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= MAX_IMAGES) {
      showAlert('提示', `最多只能添加 ${MAX_IMAGES} 张图片`);
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('权限提示', '需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsSaving(true);
        const fileName = await saveImage(result.assets[0].uri, diaryId, images.length);
        if (fileName) {
          const updatedImages = [...images, fileName].slice(0, MAX_IMAGES);
          setImages(updatedImages);
          setHasChanges(true);
          saveToHistory(content, updatedImages);
        }
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showAlert('错误', '拍照时出错');
      setIsSaving(false);
    }
  };


  const removeImage = (index: number) => {
    showAlert('删除图片', '确定要删除这张图片吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '删除', 
        style: 'destructive',
        onPress: () => {
          const fileName = images[index];
          if (fileName && !fileName.startsWith('data:')) {
            setPendingDeleteImages((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]));
          }
          const updatedImages = images.filter((_, i) => i !== index);
          setImages(updatedImages);
          setHasChanges(true);
          saveToHistory(content, updatedImages);
        }
      },
    ]);
  };

  const renderSortItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<string>) => {
    const index = getIndex() ?? 0;
    return (
      <TouchableOpacity
        style={[
          styles.sortItem,
          { borderColor: isActive ? colors.primary : colors.border, opacity: isActive ? 0.9 : 1 },
        ]}
        onLongPress={drag}
        activeOpacity={0.9}
      >
        <Image source={{ uri: getImageUri(item) }} style={styles.sortImage} resizeMode="cover" />
        <View style={[styles.sortHandle, { backgroundColor: colors.primary }]}>
          <Feather name="move" size={14} color="#FFFFFF" />
        </View>
        <View style={styles.sortIndex}>
          <Text style={styles.sortIndexText}>{index + 1}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [colors]);

  const addTagValue = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setHasChanges(true);
    }
  };

  const addTag = () => {
    addTagValue(newTag);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setHasChanges(true);
  };

  const insertPrompt = (prompt: string) => {
    setContent((prev) => prev + (prev ? '\n\n' : '') + `**${prompt}**\n`);
    setHasChanges(true);
    setShowPromptModal(false);
  };

  const handleSave = async () => {
    if (draftOnlyMode) {
      if (content.trim()) {
        saveDraft({
          diaryId,
          content,
          mood,
          weather,
          images: images.length > 0 ? images : undefined,
          tags: tags.length > 0 ? tags : undefined,
          templateUsed,
          savedAt: Date.now(),
        });
      }
      navigation.goBack();
      return;
    }

    if (pendingDeleteImages.length > 0) {
      await deleteImages(pendingDeleteImages);
      setPendingDeleteImages([]);
    }

    const entry: DiaryEntry = {
      id: diaryId,
      date: existingEntry?.date || new Date(initialDate).getTime(),
      content,
      mood,
      weather,
      images: images.length > 0 ? images : undefined,
      tags: tags.length > 0 ? tags : undefined,
      templateUsed,
      wordCount: countWords(content),
    };

    if (isEditing) {
      updateEntry(entry);
    } else {
      addEntry(entry);
    }

    clearDraft();
    navigation.goBack();
  };

  const handleClose = () => {
    if (draftOnlyMode) {
      if (content.trim()) {
        saveDraft({
          diaryId,
          content,
          mood,
          weather,
          images: images.length > 0 ? images : undefined,
          tags: tags.length > 0 ? tags : undefined,
          templateUsed,
          savedAt: Date.now(),
        });
      }
      navigation.goBack();
      return;
    }

    if (hasChanges && content.trim()) {
      showAlert(
        '退出编辑',
        '已自动保存当前内容，是否退出？',
        [
          { text: '继续编辑', style: 'cancel' },
          { text: '保存并退出', onPress: () => handleSave() },
          {
            text: '放弃更改',
            style: 'destructive',
            onPress: async () => {
              if (isEditing && originalEntryRef.current) {
                const original = originalEntryRef.current;
                const currentImages = images || [];
                const originalImages = original.images || [];
                const addedImages = currentImages.filter(img => !originalImages.includes(img));
                if (addedImages.length > 0) {
                  await deleteImages(addedImages);
                }
                setPendingDeleteImages([]);
                updateEntry({
                  ...original,
                  wordCount: countWords(original.content),
                });
              } else {
                if (!isEditing && content.trim()) {
                  if (pendingDeleteImages.length > 0) {
                    await deleteImages(pendingDeleteImages);
                  }
                  deleteEntry(diaryId);
                }
              }
              clearDraft();
              navigation.goBack();
            }
          },
        ]
      );
      return;
    }

    if (content.trim() && !existingEntry) {
      saveDraft({
        diaryId,
        content,
        mood,
        weather,
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
        templateUsed,
        savedAt: Date.now(),
      });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.cardBackground }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.cardBackground} />
      
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Feather name="x" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDate, { color: colors.textPrimary }]}>{formatDateDisplay(new Date(initialDate))}</Text>
          <Text style={[styles.wordCount, { color: colors.textMuted }]}>{countWords(content)} 字</Text>
          <Text style={[styles.headerTime, { color: colors.textMuted }]}>{formatTime(new Date())}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={undo} style={styles.headerButton} disabled={!canUndo}>
            <Feather name="rotate-ccw" size={20} color={canUndo ? colors.textPrimary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={redo} style={styles.headerButton} disabled={!canRedo}>
            <Feather name="rotate-cw" size={20} color={canRedo ? colors.textPrimary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWritingMode((prev) => !prev)} style={styles.headerButton}>
            <Feather name={writingMode ? 'minimize-2' : 'maximize-2'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPreview(!showPreview)} style={styles.headerButton}>
            <Feather name={showPreview ? 'edit-2' : 'eye'} size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Feather name="check" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {dialogMode && currentTemplate ? (
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.dialogContainer}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTemplateName, { color: colors.textSecondary }]}>
                {currentTemplate.nameZh}
              </Text>
              <Text style={[styles.dialogProgress, { color: colors.primary }]}>
                {currentQuestionIndex + 1} / {currentTemplate.questions.length}
              </Text>
            </View>
            
            <View style={[styles.dialogQuestionCard, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.dialogQuestion, { color: colors.textPrimary }]}>
                {currentTemplate.questions[currentQuestionIndex].question}
              </Text>
            </View>
            
            <TextInput
              style={[styles.dialogInput, { 
                backgroundColor: colors.inputBackground, 
                color: colors.textPrimary,
                borderColor: colors.border,
              }]}
              placeholder={currentTemplate.questions[currentQuestionIndex].placeholder}
              placeholderTextColor={colors.textMuted}
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            
            <View style={styles.dialogButtons}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity 
                  style={[styles.dialogButton, styles.dialogButtonSecondary, { borderColor: colors.border }]}
                  onPress={handleDialogBack}
                >
                  <Feather name="arrow-left" size={18} color={colors.textSecondary} />
                  <Text style={[styles.dialogButtonText, { color: colors.textSecondary }]}>上一题</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonSecondary, { borderColor: colors.border }]}
                onPress={handleDialogSkip}
              >
                <Text style={[styles.dialogButtonText, { color: colors.textSecondary }]}>跳过</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dialogButton, styles.dialogButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleDialogNext}
              >
                <Text style={[styles.dialogButtonText, { color: '#FFF' }]}>
                  {currentQuestionIndex === currentTemplate.questions.length - 1 ? '完成' : '下一题'}
                </Text>
                <Feather name={currentQuestionIndex === currentTemplate.questions.length - 1 ? 'check' : 'arrow-right'} size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.dialogExitButton} onPress={exitDialogMode}>
              <Text style={[styles.dialogExitText, { color: colors.textMuted }]}>退出引导，自由编辑</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {!writingMode && (
            <>
              <MoodPicker selectedMood={mood} onSelect={handleMoodSelect} />
              <WeatherPicker selectedWeather={weather} onSelect={handleWeatherSelect} />
            </>
          )}

          <View style={styles.editorContainer}>
            {showPreview ? (
              <View style={styles.previewContainer}>
                <MarkdownPreview content={content} images={images} />
              </View>
            ) : (
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                multiline
                placeholder="开始写下今天的故事..."
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={handleContentChange}
                textAlignVertical="top"
              />
            )}

            {!writingMode && tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tag, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    <Feather name="x" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!writingMode && images.length > 0 && (
              <View style={styles.imagesGrid}>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image 
                      source={{ uri: getImageUri(img) }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Feather name="x" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity 
                    style={[styles.addImageButton, { borderColor: colors.border }]}
                    onPress={pickFromLibrary}
                  >
                    <Feather name="plus" size={24} color={colors.textMuted} />
                    <Text style={[styles.addImageText, { color: colors.textMuted }]}>{images.length}/{MAX_IMAGES}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {!writingMode && (
          <View
            style={[
              styles.toolbar,
              {
                borderTopColor: colors.divider,
                backgroundColor: colors.cardBackground,
                paddingBottom: Layout.spacing.sm + insets.bottom,
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Feather name="file-text" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={pickFromLibrary}
              disabled={isSaving}
            >
              <Feather name="image" size={22} color={isSaving ? colors.textMuted : colors.textSecondary} />
              {images.length > 0 && (
                <View style={[styles.imageBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.imageBadgeText}>{images.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={takePhoto}
              disabled={isSaving}
            >
              <Feather name="camera" size={22} color={isSaving ? colors.textMuted : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={() => setShowSortModal(true)}
              disabled={images.length < 2}
            >
              <Feather name="move" size={22} color={images.length < 2 ? colors.textMuted : colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={() => setShowTagModal(true)}
            >
              <Feather name="tag" size={22} color={colors.textSecondary} />
              {tags.length > 0 && (
                <View style={[styles.imageBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.imageBadgeText}>{tags.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.toolButton}
              onPress={() => setShowPromptModal(true)}
            >
              <Feather name="help-circle" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      )}

      <TemplateModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelect={handleTemplateSelect}
      />

      <Modal visible={showTagModal} transparent animationType="fade" onRequestClose={() => setShowTagModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>添加标签</Text>
              <TouchableOpacity onPress={() => setShowTagModal(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBody}
            >
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.tagInput, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
                  placeholder="输入标签名称"
                  placeholderTextColor={colors.textMuted}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={[styles.tagAddButton, { backgroundColor: colors.primary }]} onPress={addTag}>
                  <Text style={styles.tagAddButtonText}>添加</Text>
                </TouchableOpacity>
              </View>
              {presetTags.length > 0 && (
                <View style={styles.tagSection}>
                  <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>预设标签</Text>
                  <View style={styles.tagSuggestionList}>
                    {presetTags.map((tag) => (
                      <TouchableOpacity
                        key={`preset-${tag}`}
                        style={[styles.tag, { backgroundColor: colors.primary + '12' }]}
                        onPress={() => addTagValue(tag)}
                      >
                        <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                        <Feather name="plus" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {suggestedTags.length > 0 && (
                <View style={styles.tagSection}>
                  <Text style={[styles.tagSectionTitle, { color: colors.textSecondary }]}>常用标签</Text>
                  <View style={styles.tagSuggestionList}>
                    {suggestedTags.map((tag) => (
                      <TouchableOpacity
                        key={`suggest-${tag}`}
                        style={[styles.tag, { backgroundColor: colors.primary + '12' }]}
                        onPress={() => addTagValue(tag)}
                      >
                        <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                        <Feather name="plus" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <View style={styles.currentTags}>
                {tags.map((tag) => (
                  <TouchableOpacity 
                    key={tag}
                    style={[styles.tag, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    <Feather name="x" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPromptModal} transparent animationType="fade" onRequestClose={() => setShowPromptModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>写作提示</Text>
              <TouchableOpacity onPress={() => setShowPromptModal(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.promptHighlight, { backgroundColor: colors.primary + '15' }]}
              onPress={() => insertPrompt(randomPrompt)}
            >
              <Feather name="edit-3" size={20} color={colors.primary} />
              <Text style={[styles.promptText, { color: colors.textPrimary }]}>{randomPrompt}</Text>
            </TouchableOpacity>
            <Text style={[styles.promptSectionTitle, { color: colors.textSecondary }]}>更多提示</Text>
            <ScrollView style={styles.promptList}>
              {WRITING_PROMPTS.filter(p => p !== randomPrompt).map((prompt, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.promptItem, { borderBottomColor: colors.divider }]}
                  onPress={() => insertPrompt(prompt)}
                >
                  <Text style={[styles.promptItemText, { color: colors.textPrimary }]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSortModal} animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <SafeAreaView style={[styles.sortModalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.sortHeader}>
            <TouchableOpacity onPress={() => setShowSortModal(false)} style={styles.sortCloseButton}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.sortTitle, { color: colors.textPrimary }]}>图片排序</Text>
            <View style={{ width: 44 }} />
          </View>
          <Text style={[styles.sortHint, { color: colors.textMuted }]}>长按图片拖拽排序</Text>
          <DraggableFlatList
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            onDragEnd={({ data }) => {
              setImages(data);
              setHasChanges(true);
              setHistory([{ content, images: data }]);
              setHistoryIndex(0);
            }}
            renderItem={renderSortItem}
            numColumns={3}
            contentContainerStyle={styles.sortGrid}
          />
        </SafeAreaView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  wordCount: {
    fontSize: 12,
    marginTop: 2,
  },
  headerTime: {
    fontSize: 11,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.lg,
  },
  editorContainer: {
    padding: Layout.spacing.md,
    minHeight: 300,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 26,
    minHeight: 200,
  },
  previewContainer: {
    minHeight: 200,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Layout.spacing.md,
    gap: 8,
  },
  imageWrapper: {
    width: '31%',
    aspectRatio: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 11,
    marginTop: 4,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderTopWidth: 1,
  },
  toolButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Layout.spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageOrderButtons: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Layout.spacing.lg,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    paddingBottom: Layout.spacing.md,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Layout.spacing.md,
  },
  tagInput: {
    flex: 1,
    height: 44,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    fontSize: 16,
  },
  tagAddButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  tagAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagSection: {
    marginBottom: Layout.spacing.md,
  },
  tagSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  tagSuggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptHighlight: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.lg,
  },
  promptText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  promptSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  promptList: {
    gap: 8,
  },
  promptItem: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  promptItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sortModalContainer: {
    flex: 1,
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sortCloseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortHint: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
    fontSize: 12,
  },
  sortGrid: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.xl,
    gap: 8,
  },
  sortItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sortImage: {
    width: '100%',
    height: '100%',
  },
  sortHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIndex: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  dialogContainer: {
    padding: Layout.spacing.lg,
    flexGrow: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  dialogTemplateName: {
    fontSize: 14,
    fontWeight: '500',
  },
  dialogProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogQuestionCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.lg,
  },
  dialogQuestion: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  dialogInput: {
    minHeight: 150,
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    marginBottom: Layout.spacing.lg,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  dialogButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: 6,
  },
  dialogButtonPrimary: {},
  dialogButtonSecondary: {
    borderWidth: 1,
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dialogExitButton: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  dialogExitText: {
    fontSize: 14,
  },
});

export default EditorScreen;
