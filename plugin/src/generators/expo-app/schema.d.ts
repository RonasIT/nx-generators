export interface ExpoAppGeneratorSchema {
  name: string;
  directory: string;
  formatName?: (value: string) => string;
}
