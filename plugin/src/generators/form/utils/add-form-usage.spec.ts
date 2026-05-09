/// <reference types="jest" />
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { addFormUsage } from './add-form-usage';

describe('addFormUsage', () => {
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

  it('prepends form hook setup and adds imports for a function component under lib/components', async () => {
    const libPath = 'libs/feature/ui/login';
    const componentDir = path.join(tmpDir, libPath, 'lib/components');

    fs.mkdirSync(componentDir, { recursive: true });
    fs.writeFileSync(
      path.join(componentDir, 'LoginForm.tsx'),
      `export function LoginForm() {\n  return null;\n}\n`,
      'utf8',
    );

    await addFormUsage(libPath, 'LoginForm', 'UserFormSchema');

    const out = fs.readFileSync(path.join(componentDir, 'LoginForm.tsx'), 'utf8');

    expect(out).toContain('useForm');
    expect(out).toContain('yupResolver');
    expect(out).toContain('UserFormSchema');
    expect(out).toContain('const formSchema = new UserFormSchema()');
    expect(out).toContain('resolver: yupResolver(UserFormSchema.validationSchema)');
    expect(out).toContain(`from '../../forms'`);
    expect(out).toContain(`from 'react-hook-form'`);
    expect(out).toContain(`from '@hookform/resolvers/yup'`);
  });
});
