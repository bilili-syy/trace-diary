import CryptoJS from 'crypto-js';

// 使用 SHA256 对 PIN 码进行哈希
// 添加盐值增强安全性
const SALT = 'MindGarden_2024_Salt';

export const hashPin = (pin: string): string => {
  const saltedPin = `${SALT}${pin}${SALT}`;
  return CryptoJS.SHA256(saltedPin).toString(CryptoJS.enc.Hex);
};

// 验证 PIN 码
export const verifyPin = (inputPin: string, storedHash: string): boolean => {
  const inputHash = hashPin(inputPin);
  return inputHash === storedHash;
};

// 验证 PIN 码格式（4-6位数字）
export const isValidPinFormat = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

// 生成唯一 ID
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`;
};
