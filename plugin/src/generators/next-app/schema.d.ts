export interface NextAppGeneratorSchema {
  name: string;
  directory: string;
  withStore: boolean;
  withApiClient?: boolean;
  withFormUtils: boolean;
  withSentry: boolean;
}
