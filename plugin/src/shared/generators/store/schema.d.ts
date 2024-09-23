import { BaseGeneratorType } from '../enums/base-generator-type';

export interface StoreGeneratorSchema {
  name: string;
  directory: string;
  baseGeneratorType: BaseGeneratorType;
}
