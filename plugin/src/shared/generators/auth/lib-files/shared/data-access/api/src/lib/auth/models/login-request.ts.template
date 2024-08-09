import { Expose } from 'class-transformer';

export class LoginRequest {
  @Expose()
  public email: string;

  @Expose()
  public password: string;

  constructor(request: Partial<LoginRequest> = {}) {
    Object.assign(this, request);
  }
}
