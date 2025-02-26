import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'mobile',
  // If we need more security, we can use EAS secret variables here
  encryptionKey: 'mobile',
});
