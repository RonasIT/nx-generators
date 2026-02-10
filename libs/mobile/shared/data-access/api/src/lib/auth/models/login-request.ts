import { Expose } from 'class-transformer';

export class LoginRequest {
  @Expose()
  public username: string;

  @Expose()
  public password: string;

  // Default to 60 minutes
  @Expose()
  public expiresInMins?: number;

  constructor(request: Partial<LoginRequest> = {}) {
    Object.assign(this, request);
  }
}
