import { Expose, Type } from 'class-transformer';
import { User } from '../../user';
import { RefreshTokenResponse } from './refresh-token-response';

export class LogInResponse extends RefreshTokenResponse {
  @Expose()
  @Type(() => User)
  public user: User;

  constructor(partial: Partial<LogInResponse> = {}) {
    super(partial);

    Object.assign(this, partial);
  }
}
