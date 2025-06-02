import { isNil } from 'lodash-es';

export type LinkWithOptionalParamsGenerator<TRootParams extends object = never> = keyof TRootParams extends never
  ? () => string
  : (args?: TRootParams) => string;

export const getLinkWithParamsGenerator = <TRootParams extends object = never>(
  basePath: string,
): LinkWithOptionalParamsGenerator<TRootParams> => {
  return ((args?: TRootParams) => {
    if (!args || Object.keys(args).length === 0) {
      return basePath;
    }

    const resultBasePath = basePath.replace(/\[(\w+)]/g, (match, paramName) => {
      return paramName in args ? String(args[paramName as keyof TRootParams]) : match;
    });

    const queryString = Object.entries(args)
      .flatMap(([key, value]) => {
        if (isNil(value) || basePath.includes(`[${key}]`)) {
          return [];
        }

        if (Array.isArray(value)) {
          const uniqueValues = Array.from(new Set(value));

          return uniqueValues.map((value) => `${key}=${encodeURIComponent(String(value))}`);
        }

        const encodedValue = encodeURIComponent(String(value));

        return [`${key}=${encodedValue}`];
      })
      .join('&');

    return `${resultBasePath}${queryString ? `?${queryString}` : ''}`;
  }) as LinkWithOptionalParamsGenerator<TRootParams>;
};
