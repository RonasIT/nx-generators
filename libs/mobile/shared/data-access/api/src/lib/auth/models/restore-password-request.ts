import { Expose } from 'class-transformer';

export class RestorePasswordRequest {
  @Expose()
  public password: string;

  @Expose()
  public token: string;

  constructor(partial: Partial<RestorePasswordRequest>) {
    Object.assign(this, partial);
  }
}
