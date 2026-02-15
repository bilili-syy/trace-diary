import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Layout, Typography, DIARY_TEMPLATES } from '../constants';
import { DiaryTemplate } from '../types';

interface TemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: DiaryTemplate) => void;
}

export function TemplateModal({ visible, onClose, onSelect }: TemplateModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>选择写作模板</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {DIARY_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => {
                  onSelect(template);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateIcon}>
                    <Feather 
                      name={template.id === 'free' ? 'edit-3' : 'file-text'} 
                      size={20} 
                      color={Colors.primary} 
                    />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.nameZh}</Text>
                    <Text style={styles.templateNameEn}>{template.name}</Text>
                  </View>
                </View>
                
                {template.questions.length > 0 && (
                  <View style={styles.questionsPreview}>
                    {template.questions.slice(0, 2).map((q, index) => (
                      <Text key={index} style={styles.questionText} numberOfLines={1}>
                        • {q.question}
                      </Text>
                    ))}
                    {template.questions.length > 2 && (
                      <Text style={styles.moreText}>
                        +{template.questions.length - 2} 更多问题
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Layout.spacing.xs,
  },
  content: {
    padding: Layout.spacing.md,
  },
  templateCard: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  templateNameEn: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  questionsPreview: {
    marginTop: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  questionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  moreText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginTop: 4,
  },
});

export default TemplateModal;
