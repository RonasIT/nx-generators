import { BaseEntity } from '@ronas-it/rtkq-entity-api';
import { Expose } from 'class-transformer';

export class Media extends BaseEntity<number> {
  @Expose()
  public link: string;

  @Expose()
  public name: string;

  constructor(media: Partial<Media>) {
    super(media);
    Object.assign(this, media);
  }
}
