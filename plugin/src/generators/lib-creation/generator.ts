import { formatFiles, generateFiles, Tree } from '@nx/devkit';
import * as path from 'path';
import { LibCreationGeneratorSchema } from './schema';
import { execSync } from 'child_process';

export async function libCreationGenerator(
  tree: Tree,
  options: LibCreationGeneratorSchema
) {
  const libPath = options.directory
    ? `libs/${options.directory}`
    : `libs/${options.app}/${options.scope}/${options.type}/${options.name}`;

  execSync(
    `npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none ${libPath}`,
    { stdio: 'inherit' }
  );

  options.withComponent &&
    generateFiles(
      tree,
      path.join(__dirname, 'files'),
      `${libPath}/src`,
      options
    );
  await formatFiles(tree);
}

export default libCreationGenerator;
