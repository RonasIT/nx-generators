export const dynamicImport = new Function('specifier', 'return import(specifier)') as <T = never>(
  specifier: string,
) => Promise<T>;
