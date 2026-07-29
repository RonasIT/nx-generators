import { Expose } from 'class-transformer';

export class RefreshTokenResponse {
  @Expose()
  public accessToken: string;

  @Expose()
  public refreshToken: string;

  constructor(partial: Partial<RefreshTokenResponse>) {
    Object.assign(this, partial);
  }
}
