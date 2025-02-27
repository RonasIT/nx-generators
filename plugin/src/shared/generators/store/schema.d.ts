import { BaseGeneratorType } from '../../enums/base-generator-type';

export interface StoreGeneratorSchema {
  directory: string;
  baseGeneratorType: BaseGeneratorType;
}
