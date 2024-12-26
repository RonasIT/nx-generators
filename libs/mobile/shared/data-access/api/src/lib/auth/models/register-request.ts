import { Expose } from 'class-transformer';

export class RegisterRequest {
  @Expose()
  public username: string;

  @Expose()
  public email: string;

  @Expose()
  public password: string;

  @Expose()
  public confirm: string;

  constructor(partial: Partial<RegisterRequest>) {
    Object.assign(this, partial);
  }
}
