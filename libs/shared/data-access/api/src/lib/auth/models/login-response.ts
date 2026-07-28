import { Expose } from 'class-transformer';
import { User } from '../../user';

export class LogInResponse extends User {
  @Expose()
  public accessToken: string;

  @Expose()
  public refreshToken: string;

  constructor(partial: Partial<LogInResponse> = {}) {
    super(partial);

    Object.assign(this, partial);
  }
}
