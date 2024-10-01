export function formatLibName(libName: string, scopeName: string): string {
  const libWords = libName.split('-');
  const scopeWords = scopeName.split('-');
  const startsWithScopeWords = scopeWords.every((word, index) => libWords[index] === word);

  if (startsWithScopeWords && libWords.length > scopeWords.length) {
    return libWords.slice(scopeWords.length).join('-');
  }

  return libName;
}
