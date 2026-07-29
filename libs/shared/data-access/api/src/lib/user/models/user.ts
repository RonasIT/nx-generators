import { BaseEntity } from '@ronas-it/rtkq-entity-api';
import { Expose } from 'class-transformer';

export class User extends BaseEntity<number> {
  @Expose()
  public username: string;

  @Expose()
  public email: string;

  @Expose()
  public firstName: string;

  @Expose()
  public lastName: string;

  @Expose()
  public gender: string;

  @Expose()
  public image: string;

  constructor(model: Partial<User>) {
    super(model);
    Object.assign(this, model);
  }
}
