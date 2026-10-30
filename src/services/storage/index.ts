import { Platform } from 'react-native';

import { nativeDriver } from './driver.native';
import { webDriver } from './driver.web';
import { createSafeStorage } from './safeStorage';

const platformDriver = Platform.OS === 'web' ? webDriver : nativeDriver;

export const storage = createSafeStorage(platformDriver);

export { createMemoryStorage, createSafeStorage } from './safeStorage';
export type { KeyValueStorage } from './safeStorage';
