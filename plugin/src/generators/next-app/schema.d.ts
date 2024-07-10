export interface NextAppGeneratorSchema {
  name: string;
  directory: string;
  formatName?: (value: string, withoutSpaces?: boolean) => string;
}
