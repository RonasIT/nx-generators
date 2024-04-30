export interface ReactLibGeneratorSchema {
  directory?: string;
  app?: string;
  scope?: string;
  type?: string;
  name?: string;
  withComponent?: boolean;
  dryRun?: boolean;
  formatName?: (value: string, withoutSpaces?: boolean) => string;
}
