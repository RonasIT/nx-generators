import { Expose } from 'class-transformer';

export class RefreshTokenRequest {
  @Expose()
  public refreshToken: string;

  // Default to 60 minutes
  @Expose()
  public expiresInMins?: number;

  constructor(partial: Partial<RefreshTokenRequest>) {
    Object.assign(this, partial);
  }
}
