import { i18n } from '@ronas-it/react-native-common-modules';
import * as Yup from 'yup';
import { BaseFormSchema, FormValues } from '@example/mobile/shared/utils/form';

export class LoginFormSchema implements BaseFormSchema<LoginFormSchema> {
  public email: string;
  public password: string;

  constructor(schema?: Partial<LoginFormSchema>) {
    this.email = schema?.email || '';
    this.password = schema?.password || '';
  }


  public static get validationSchema(): Yup.ObjectSchema<FormValues<LoginFormSchema>> {
    return Yup.object().shape({
      email: Yup.string()
        .email(i18n.t('AUTH.VALIDATION.TEXT_VALIDATION_EMAIL'))
        .required(i18n.t('AUTH.VALIDATION.TEXT_VALIDATION_REQUIRED_FIELD')),
      password: Yup.string().required(i18n.t('TEXT_VALIDATION_REQUIRED_FIELD'))
    });
  }

  public get formValues(): FormValues<LoginFormSchema> {
    return {
      email: this.email,
      password: this.password,
    };
  }
}
