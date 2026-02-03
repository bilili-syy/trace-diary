import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
  readAsStringAsync,
  writeAsStringAsync,
  readDirectoryAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { getImageCompression } from '../api/storage';

const IMAGE_DIR = 'diary-images';
const getImageDir = () => `${documentDirectory}${IMAGE_DIR}/`;

export const ensureImageDir = async (): Promise<void> => {
  const dir = getImageDir();
  const dirInfo = await getInfoAsync(dir);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const generateImageFileName = (diaryId: string, index: number): string => {
  return `${diaryId}_${index}_${Date.now()}.jpg`;
};

export const getImagePath = (fileName: string): string => {
  return `${getImageDir()}${fileName}`;
};

export const saveImage = async (
  uri: string,
  diaryId: string,
  index: number,
  compress?: boolean
): Promise<string | null> => {
  try {
    await ensureImageDir();

    const shouldCompress = compress ?? getImageCompression();
    const fileName = generateImageFileName(diaryId, index);
    const destPath = getImagePath(fileName);

    if (shouldCompress) {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      await copyAsync({
        from: manipulated.uri,
        to: destPath,
      });
    } else {
      await copyAsync({
        from: uri,
        to: destPath,
      });
    }

    return fileName;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
};

export const deleteImage = async (fileName: string): Promise<void> => {
  try {
    const path = getImagePath(fileName);
    const fileInfo = await getInfoAsync(path);
    if (fileInfo.exists) {
      await deleteAsync(path);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

export const deleteImages = async (fileNames: string[]): Promise<void> => {
  await Promise.all(fileNames.map(deleteImage));
};

export const getImageUri = (fileName: string): string => {
  if (fileName.startsWith('file://') || fileName.startsWith('data:')) {
    return fileName;
  }
  return getImagePath(fileName);
};

export const migrateBase64ToFile = async (
  base64: string,
  diaryId: string,
  index: number
): Promise<string | null> => {
  try {
    await ensureImageDir();

    const fileName = generateImageFileName(diaryId, index);
    const destPath = getImagePath(fileName);

    await writeAsStringAsync(destPath, base64, {
      encoding: EncodingType.Base64,
    });

    return fileName;
  } catch (error) {
    console.error('Error migrating base64 to file:', error);
    return null;
  }
};

export const imageExists = async (fileName: string): Promise<boolean> => {
  try {
    const path = getImagePath(fileName);
    const info = await getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
};

export const cleanupOrphanedImages = async (usedFileNames: Set<string>): Promise<void> => {
  try {
    const dir = getImageDir();
    const dirInfo = await getInfoAsync(dir);
    if (!dirInfo.exists) return;

    const files = await readDirectoryAsync(dir);
    for (const file of files) {
      if (!usedFileNames.has(file)) {
        await deleteImage(file);
      }
    }
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
  }
};

export const readImageAsBase64 = async (fileName: string): Promise<string | null> => {
  try {
    const path = getImagePath(fileName);
    const info = await getInfoAsync(path);
    if (info.exists) {
      return await readAsStringAsync(path, { encoding: EncodingType.Base64 });
    }
  } catch (error) {
    console.error(`Error reading image ${fileName}:`, error);
  }
  return null;
};

export const writeImageFromBase64 = async (fileName: string, base64: string): Promise<void> => {
  await ensureImageDir();
  const destPath = getImagePath(fileName);
  await writeAsStringAsync(destPath, base64, { encoding: EncodingType.Base64 });
};

export const getAllImageFileNames = async (): Promise<string[]> => {
  try {
    const dir = getImageDir();
    const dirInfo = await getInfoAsync(dir);
    if (!dirInfo.exists) return [];
    return await readDirectoryAsync(dir);
  } catch {
    return [];
  }
};
