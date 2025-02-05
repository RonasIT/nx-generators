import { Expose } from 'class-transformer';

export class ForgotPasswordRequest {
  @Expose()
  public email: string;

  constructor(request: Partial<ForgotPasswordRequest> = {}) {
    Object.assign(this, request);
  }
}
