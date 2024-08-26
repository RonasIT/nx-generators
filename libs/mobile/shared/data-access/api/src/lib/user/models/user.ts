import { BaseEntity } from '@ronas-it/rtkq-entity-api';
import { Expose, Type } from 'class-transformer';
import { Avatar } from './avatar';

export class User extends BaseEntity<number> {
  @Expose()
  public username: string;

  @Expose()
  public nickname: string;

  @Expose()
  public email: string;

  @Expose()
  @Type(() => Avatar)
  public avatar?: Avatar;

  constructor(model: Partial<User>) {
    super(model);
    Object.assign(this, model);
  }
}
