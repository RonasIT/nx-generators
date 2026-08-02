export interface NextAppGeneratorSchema {
  name: string;
  directory: string;
  withStore: boolean;
  withApiClient?: boolean;
  withAuth?: boolean;
  withFormUtils: boolean;
  withSentry: boolean;
  withNuqs: boolean;
  withMantine: boolean;
}
