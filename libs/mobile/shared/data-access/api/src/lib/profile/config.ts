import { GetProfileRequest } from './models';

export const profileApiConfig = {
  defaultGetProfileParams: {
    relations: ['avatar.media']
  } as GetProfileRequest
};
