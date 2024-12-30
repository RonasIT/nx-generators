import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<{ projects: Array<string> }> => ({
  projects: await getJestProjectsAsync()
});
