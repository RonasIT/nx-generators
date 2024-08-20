import { LibraryPresetType } from '../../shared/enums/library-preset-type';

export interface ReactLibGeneratorSchema {
  directory?: string;
  app?: string;
  scope?: string;
  type?: string;
  name?: string;
  withComponent?: boolean;
  dryRun?: boolean;
  preset?: LibraryPresetType;
}
