import { Tree } from '@nx/devkit';
import { LibRenameGeneratorSchema } from './schema';
import { askQuestion, getLibraryDetailsByName } from '../../shared/utils';
import { execSync } from 'child_process';

export async function libRenameGenerator(
  tree: Tree,
  options: LibRenameGeneratorSchema
) {
  const { name: currentLibraryName, path: currentLibraryPath } = await getLibraryDetailsByName(tree, options.currentLibName);
  
  const libPathSegments = currentLibraryPath.split('/');
  const defaultDestLibraryName = libPathSegments.pop();
  const destLibraryName = options.newLibName || await askQuestion('Enter a new library name: ', defaultDestLibraryName);
  
  // Remove `libs` path fragment
  libPathSegments.shift();
  libPathSegments.push(destLibraryName);

  const destLibraryPath = libPathSegments.join('/');
  // NOTE: Disable selection for library name (as provided / as derived) by excluding stdio from options
  const log = execSync(`npx nx g mv --project=${currentLibraryName} --destination=${destLibraryPath}`);
  
  console.log(log.toString('utf8'));
}

export default libRenameGenerator;
