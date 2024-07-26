export const formatName = (value: string, withoutSpaces = false) =>
  value
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
    .join(withoutSpaces ? '' : ' ');

export const formatAppIdentifier = (value: string) =>
  value.toLowerCase().replace(/-/g, '.');

export const getProjectName = (str: string) => {
  const parts = str.split('@');

  return parts.length > 1 ? parts[1].split('/')[0] : parts[0];
};

export const getLibName = (path: string) => path.split('/').pop();
