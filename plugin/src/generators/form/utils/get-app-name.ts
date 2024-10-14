export function getAppName(path: string): string {
  return path.split('/')[1];
}
