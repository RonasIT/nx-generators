export function getLibDirectoryName(libName: string, scopeName: string): string {
  const libWords = libName.split('-');
  const scopeWords = scopeName.split('-');
  let newLibWords = libWords;

  const startsWithScopeWords = scopeWords.every((word, index) => libWords[index] === word);
  if (startsWithScopeWords && libWords.length > scopeWords.length) {
    newLibWords = libWords.slice(scopeWords.length);
  }

  return newLibWords.join('-');
}
