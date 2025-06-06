import { isNil } from 'lodash-es';

export type LinkBuilder<TRootParams extends object = never> = keyof TRootParams extends never
  ? () => string
  : (args?: TRootParams) => string;

export const getLinkBuilder = <TRootParams extends object = never>(basePath: string): LinkBuilder<TRootParams> => {
  return ((args?: TRootParams) => {
    if (!args || Object.keys(args).length === 0) {
      return basePath;
    }

    const resultBasePath = basePath.replace(/\[(\w+)]/g, (match, paramName) => {
      return paramName in args ? String(args[paramName as keyof TRootParams]) : match;
    });

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(args)) {
      if (isNil(value) || basePath.includes(`[${key}]`)) {
        continue;
      }

      if (Array.isArray(value)) {
        const uniqueValues = Array.from(new Set(value));
        uniqueValues.forEach((value) => searchParams.append(key, String(value)));
      } else {
        searchParams.append(key, String(value));
      }
    }

    const queryString = searchParams.toString();

    return `${resultBasePath}${queryString ? `?${queryString}` : ''}`;
  }) as LinkBuilder<TRootParams>;
};
