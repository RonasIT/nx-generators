export interface ExpoAppGeneratorSchema {
  name: string;
  directory: string;
  withStore: boolean;
  withUiKit: boolean;
  withApiClient?: boolean;
  withAuth?: boolean;
  withSentry: boolean;
  withFormUtils: boolean;
}
