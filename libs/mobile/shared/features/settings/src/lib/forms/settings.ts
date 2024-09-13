import * as Yup from 'yup';
import { BaseFormSchema, FormValues } from '@ronas-it/mobile/shared/utils/form';

export class SettingsFormSchema implements BaseFormSchema<SettingsFormSchema> {
  // Add fields here, for example,
  // public email: string;

  public get formValues(): FormValues<SettingsFormSchema> {
    return {
      // Add fields here, for example,
      // email: this.email
    };
  }

  public static get validationSchema(): Yup.ObjectSchema<
    FormValues<SettingsFormSchema>
  > {
    return Yup.object().shape({
      // Add validation rules here, for example,
      // email: Yup.string().required().email()
    });
  }

  constructor(schema?: Partial<SettingsFormSchema>) {
    // Add initial values here, for example,
    // this.email = schema?.email || ''
  }
}
