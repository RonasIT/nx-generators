import { createApiCreator } from '@ronas-it/rtkq-entity-api';
import { axiosBaseQuery } from './base-query';

export const createAppApi = createApiCreator({
  baseQuery: axiosBaseQuery
});
