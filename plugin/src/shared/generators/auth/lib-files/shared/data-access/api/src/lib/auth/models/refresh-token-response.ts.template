import { Expose } from 'class-transformer';

export class RefreshTokenResponse {
  @Expose()
  public token: string;

  @Expose()
  public ttl: number;

  @Expose({ name: 'refresh_ttl' })
  public refreshTtl: string;

  constructor(partial: Partial<RefreshTokenResponse>) {
    Object.assign(this, partial);
  }
}
