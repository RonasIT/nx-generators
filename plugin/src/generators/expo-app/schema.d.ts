export interface ExpoAppGeneratorSchema {
  name: string;
  directory: string;
  withStore: boolean;
  withApiClient?: boolean;
  withAuth?: boolean;
  withSentry: boolean;
  withFormUtils: boolean;
  withUIKitten: boolean;
}
