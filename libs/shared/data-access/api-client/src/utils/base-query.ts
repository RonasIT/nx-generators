import { BaseQueryFunction, createAxiosBaseQuery } from '@ronas-it/rtkq-entity-api';
import { apiService } from '../service';

export const axiosBaseQuery: BaseQueryFunction = createAxiosBaseQuery({
  getHttpClient: () => apiService.httpClient,
});
