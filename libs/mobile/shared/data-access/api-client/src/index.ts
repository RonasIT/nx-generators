import { createApiClient } from '@ronas-it/shared/data-access/api-client';
import { configuration } from './configuration';

export * from './configuration';

export const { apiService, axiosBaseQuery, createAppApi } = createApiClient(configuration.apiURL);
