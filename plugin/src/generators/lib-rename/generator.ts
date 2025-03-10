import { execSync } from 'child_process';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { askQuestion, getImportPathPrefix, getLibraryDetailsByName } from '../../shared/utils';
import { LibRenameGeneratorSchema } from './schema';

export async function libRenameGenerator(tree: Tree, options: LibRenameGeneratorSchema): Promise<void> {
  const { name: currentLibraryName, path: currentLibraryPath } = await getLibraryDetailsByName(
    tree,
    options.currentLibName,
  );

  const libPathSegments = currentLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName =
    options.newLibName || await askQuestion('Enter a new library name: ', defaultDestLibraryName);

  // Remove `libs` path fragment
  libPathSegments.shift();
  libPathSegments.push(destLibraryName);

  const destLibraryPath = `libs/${libPathSegments.join('/')}`;
  const newLibImportPath = path
    .normalize(libPathSegments.join('/'))
    .split(path.sep)
    .join('/');
  const fullLibraryPath = `${getImportPathPrefix(tree)}/${newLibImportPath}`;
  const fullLibraryName = newLibImportPath.split('/').join('-');

  execSync(`npx nx g mv --projectName=${currentLibraryName} --newProjectName=${fullLibraryName} --destination=${destLibraryPath} --importPath=${fullLibraryPath}`, { stdio: 'inherit' });
}

export default libRenameGenerator;
