import { ApiService } from '@ronas-it/axios-api-client';
import { createApiCreator, createAxiosBaseQuery } from '@ronas-it/rtkq-entity-api';

export function createApiClient(apiURL: string) {
  const apiService = new ApiService(apiURL);

  const axiosBaseQuery = createAxiosBaseQuery({
    getHttpClient: () => apiService.httpClient,
  });

  const createAppApi = createApiCreator({
    baseQuery: axiosBaseQuery,
  });

  return { apiService, axiosBaseQuery, createAppApi };
}

export type CreateAppApi = ReturnType<typeof createApiClient>['createAppApi'];
