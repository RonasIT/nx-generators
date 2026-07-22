import { BaseQueryFunction, prepareRequestParams } from '@ronas-it/rtkq-entity-api';
import { plainToInstance } from 'class-transformer';
import { CreateAppApi } from '@ronas-it/shared/data-access/api-client';
import { User } from '../user';

export enum ProfileApiTag {
  PROFILE = 'profile',
}

export function createProfileApi(createAppApi: CreateAppApi, axiosBaseQuery: BaseQueryFunction) {
  return createAppApi({
    reducerPath: 'profile',
    tagTypes: [ProfileApiTag.PROFILE],
    baseQuery: axiosBaseQuery,
    endpoints: (builder) => ({
      getProfile: builder.query<User, void>({
        query: () => ({
          method: 'GET',
          url: '/auth/me',
        }),
        transformResponse: (response) => plainToInstance(User, response),
        providesTags: [ProfileApiTag.PROFILE],
      }),
      updateProfile: builder.mutation<User, { id: string; data: Partial<User> }>({
        query: (params) => {
          const request = prepareRequestParams(params.data, User);

          return {
            method: 'PUT',
            url: `/users/${params.id}`,
            data: request,
          };
        },
        invalidatesTags: [ProfileApiTag.PROFILE],
      }),
      deleteProfile: builder.mutation<void, { id: string }>({
        query: (params) => {
          return {
            method: 'DELETE',
            url: `/users/${params.id}`,
          };
        },
        invalidatesTags: [ProfileApiTag.PROFILE],
      }),
    }),
  });
}
