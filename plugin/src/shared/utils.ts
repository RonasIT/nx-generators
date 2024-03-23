export const formatName = (value: string) =>
  value
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
    .join(' ');

export const getProjectName = (str: string) => {
  const parts = str.split('@');

  return parts.length > 1 ? parts[1].split('/')[0] : parts[0];
};
