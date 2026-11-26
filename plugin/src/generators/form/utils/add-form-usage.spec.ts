/// <reference types="jest" />
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addFormUsage } from './add-form-usage';

describe('addFormUsage', () => {
  const libPath = 'libs/feature/ui/login';
  const formsPath = `${libPath}/lib/forms`;

  let tmpDir: string;
  let prevCwd: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-gen-form-'));
    prevCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(prevCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const writeSourceFile = (relativePath: string, content: string): string => {
    const filePath = path.join(tmpDir, libPath, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');

    return filePath;
  };

  it('adds form setup before the existing component body', async () => {
    const sourceFilePath = writeSourceFile(
      'lib/components/LoginForm.tsx',
      `import { Button } from '@mantine/core';

export function LoginForm() {
  return <Button onClick={form.handleSubmit(() => undefined)}>Login</Button>;
}
`,
    );

    await addFormUsage(libPath, formsPath, 'LoginForm', 'UserFormSchema');

    const out = fs.readFileSync(sourceFilePath, 'utf8');

    expect(out).toContain(`import { UserFormSchema } from '../forms';`);
    expect(out).toContain(`import { Button } from '@mantine/core';`);
    expect(out).toContain(`import { useForm } from 'react-hook-form';`);
    expect(out).toContain(`import { yupResolver } from '@hookform/resolvers/yup';`);
    expect(out).toContain(
      `export function LoginForm() {
  const formSchema = new UserFormSchema();
  const form = useForm({
    defaultValues: formSchema.formValues,
    resolver: yupResolver(UserFormSchema.validationSchema)
  });

  return <Button onClick={form.handleSubmit(() => undefined)}>Login</Button>;
}`,
    );
  });

  it.each([
    ['lib/components/auth/LoginForm.tsx', 'LoginForm', '../../forms'],
    ['lib/hooks/useLogin.ts', 'useLogin', '../forms'],
    ['lib/hooks/auth/useLogin.ts', 'useLogin', '../../forms'],
    ['lib/form-text-input/component.tsx', 'FormTextInput', '../forms'],
  ])('uses a relative forms import from %s', async (sourceFile, placeOfUse, moduleSpecifier) => {
    const sourceFilePath = writeSourceFile(sourceFile, `export const ${placeOfUse} = () => { return null; };\n`);

    await addFormUsage(libPath, formsPath, placeOfUse, 'UserFormSchema');

    expect(fs.readFileSync(sourceFilePath, 'utf8')).toContain(`import { UserFormSchema } from '${moduleSpecifier}';`);
  });
});
