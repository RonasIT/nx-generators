import { Expose, Type } from 'class-transformer';
import { Media } from '../../media';

export class Avatar {
  @Expose()
  public id: number;

  @Expose()
  @Type(() => Media)
  public media: Media;

  constructor(model: Partial<Avatar>) {
    Object.assign(this, model);
  }
}
