import { execSync } from 'child_process';
import { Tree } from '@nx/devkit';
import { askQuestion, getLibraryDetailsByName } from '../../shared/utils';
import { LibRenameGeneratorSchema } from './schema';

export async function libRenameGenerator(tree: Tree, options: LibRenameGeneratorSchema) {
  const { name: currentLibraryName, path: currentLibraryPath } = await getLibraryDetailsByName(
    tree,
    options.currentLibName,
  );

  const libPathSegments = currentLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName =
    options.newLibName || (await askQuestion('Enter a new library name: ', defaultDestLibraryName));

  // Remove `libs` path fragment
  libPathSegments.shift();
  libPathSegments.push(destLibraryName);

  const destLibraryPath = `libs/${libPathSegments.join('/')}`;
  execSync(`npx nx g mv --project=${currentLibraryName} --destination=${destLibraryPath}`, { stdio: 'inherit' });
}

export default libRenameGenerator;
