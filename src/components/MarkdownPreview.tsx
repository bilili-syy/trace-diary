import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { Layout } from '../constants';
import { getImageUri } from '../utils/imageStorage';

interface MarkdownPreviewProps {
  content: string;
  images?: string[];
}

export function MarkdownPreview({ content, images }: MarkdownPreviewProps) {
  const { colors } = useTheme();

  const parseMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listIndex = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        elements.push(<View key={index} style={styles.spacer} />);
        return;
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <Text key={index} style={[styles.h3, { color: colors.textPrimary }]}>
            {trimmed.slice(4)}
          </Text>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <Text key={index} style={[styles.h2, { color: colors.textPrimary }]}>
            {trimmed.slice(3)}
          </Text>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <Text key={index} style={[styles.h1, { color: colors.textPrimary }]}>
            {trimmed.slice(2)}
          </Text>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <View key={index} style={styles.listItem}>
            <Text style={[styles.listBullet, { color: colors.primary }]}>•</Text>
            <Text style={[styles.listText, { color: colors.textPrimary }]}>
              {renderInlineStyles(trimmed.slice(2), colors)}
            </Text>
          </View>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        listIndex++;
        const textContent = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <View key={index} style={styles.listItem}>
            <Text style={[styles.listNumber, { color: colors.primary }]}>{listIndex}.</Text>
            <Text style={[styles.listText, { color: colors.textPrimary }]}>
              {renderInlineStyles(textContent, colors)}
            </Text>
          </View>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <View key={index} style={[styles.blockquote, { borderLeftColor: colors.primary, backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.blockquoteText, { color: colors.textSecondary }]}>
              {renderInlineStyles(trimmed.slice(2), colors)}
            </Text>
          </View>
        );
      } else if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
        elements.push(<View key={index} style={[styles.hr, { backgroundColor: colors.divider }]} />);
      } else {
        listIndex = 0;
        elements.push(
          <Text key={index} style={[styles.paragraph, { color: colors.textPrimary }]}>
            {renderInlineStyles(trimmed, colors)}
          </Text>
        );
      }
    });

    return elements;
  };

  const renderInlineStyles = (text: string, colors: any): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    const patterns = [
      { regex: /\*\*\*(.+?)\*\*\*/g, style: [styles.bold, styles.italic] },
      { regex: /\*\*(.+?)\*\*/g, style: [styles.bold] },
      { regex: /\*(.+?)\*/g, style: [styles.italic] },
      { regex: /__(.+?)__/g, style: [styles.bold] },
      { regex: /_(.+?)_/g, style: [styles.italic] },
      { regex: /~~(.+?)~~/g, style: [styles.strikethrough] },
      { regex: /`(.+?)`/g, style: [styles.code, { backgroundColor: colors.inputBackground }] },
    ];

    let hasMatch = true;
    while (hasMatch && remaining.length > 0) {
      hasMatch = false;
      let earliestMatch: { index: number; length: number; content: string; style: any[] } | null = null;

      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(remaining);
        if (match && (!earliestMatch || match.index < earliestMatch.index)) {
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            content: match[1],
            style: pattern.style,
          };
        }
      }

      if (earliestMatch) {
        hasMatch = true;
        if (earliestMatch.index > 0) {
          parts.push(
            <Text key={keyIndex++}>{remaining.slice(0, earliestMatch.index)}</Text>
          );
        }
        parts.push(
          <Text key={keyIndex++} style={earliestMatch.style}>
            {earliestMatch.content}
          </Text>
        );
        remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
      }
    }

    if (remaining.length > 0) {
      parts.push(<Text key={keyIndex++}>{remaining}</Text>);
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  };

  return (
    <View style={styles.container}>
      {parseMarkdown(content)}
      {images && images.length > 0 && (
        <View style={styles.imagesContainer}>
          {images.map((img, index) => (
            <Image
              key={index}
              source={{ uri: getImageUri(img) }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  spacer: { height: 8 },
  h1: { fontSize: 24, fontWeight: 'bold', marginVertical: 12, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600', marginVertical: 10, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600', marginVertical: 8, lineHeight: 26 },
  paragraph: { fontSize: 16, lineHeight: 26, marginVertical: 4 },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  strikethrough: { textDecorationLine: 'line-through' },
  code: { fontFamily: 'monospace', paddingHorizontal: 4, borderRadius: 4 },
  listItem: { flexDirection: 'row', marginVertical: 4, paddingLeft: 8 },
  listBullet: { width: 20, fontSize: 16, fontWeight: '600' },
  listNumber: { width: 24, fontSize: 16, fontWeight: '500' },
  listText: { flex: 1, fontSize: 16, lineHeight: 24 },
  blockquote: { 
    borderLeftWidth: 4, 
    paddingLeft: 12, 
    paddingVertical: 8, 
    marginVertical: 8,
    borderRadius: 4,
  },
  blockquoteText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  hr: { height: 1, marginVertical: 16 },
  imagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  image: { width: 100, height: 100, borderRadius: 8 },
});

export default MarkdownPreview;
