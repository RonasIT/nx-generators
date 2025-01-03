import { AppEnv } from './env';

export type AppEnvName = 'development' | 'production';

export const appEnv = new AppEnv<AppEnvName>(process.env.EXPO_PUBLIC_APP_ENV as AppEnvName);
