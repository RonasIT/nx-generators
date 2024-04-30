export interface ReactComponentGeneratorSchema {
  directory?: string;
  name?: string;
  subcomponent?: boolean;
  formatName?: (value: string, withoutSpaces?: boolean) => string;
}
