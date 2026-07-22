import { axiosBaseQuery, createAppApi } from '@ronas-it/mobile/shared/data-access/api-client';
import { createAuthApi, createProfileApi } from '@ronas-it/shared/data-access/api';

export * from '@ronas-it/shared/data-access/api';

export const authApi = createAuthApi(createAppApi);
export const profileApi = createProfileApi(createAppApi, axiosBaseQuery);
