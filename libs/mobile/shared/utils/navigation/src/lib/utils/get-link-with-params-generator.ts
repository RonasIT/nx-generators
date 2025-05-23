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

    const hasIdSlug = 'id' in args && basePath.includes('[id]');
    const resultBasePath = hasIdSlug ? basePath.replace('[id]', String(args.id)) : basePath;

    const queryString = Object.entries(args)
      .flatMap(([key, value]) => {
        if (isNil(value) || (hasIdSlug && key === 'id')) {
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

    return `${resultBasePath}?${queryString}`;
  }) as LinkWithOptionalParamsGenerator<TRootParams>;
};
