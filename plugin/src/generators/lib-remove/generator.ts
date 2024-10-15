import { Tree } from '@nx/devkit';
import { LibRemoveGeneratorSchema } from './schema';
import { askQuestion, selectProject } from '../../shared/utils';
import { execSync } from 'child_process';

export async function libRemoveGenerator(
  tree: Tree,
  options: LibRemoveGeneratorSchema
) {
  const libraryName = options.libName || (await selectProject(tree, 'library', 'Select the library to remove: ')).name;

  if (!libraryName) {
    throw new Error('No library found!');
  }

  const isConfirmed = await askQuestion(`Are you sure you want to remove ${libraryName} (y/n)?`);

  if (!isConfirmed) {
    return;
  }

  execSync(`npx nx g rm --project=${libraryName}`, { stdio: 'inherit' });
}

export default libRemoveGenerator;
