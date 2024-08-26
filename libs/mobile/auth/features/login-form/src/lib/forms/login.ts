import { useTranslation } from '@ronas-it/react-native-common-modules/src/utils/i18n';
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
    const translate = useTranslation('AUTH.VALIDATION');

    return Yup.object().shape({
      email: Yup.string()
        .email(translate('TEXT_VALIDATION_EMAIL'))
        .required(translate('TEXT_VALIDATION_REQUIRED_FIELD')),
      password: Yup.string().required(translate('TEXT_VALIDATION_REQUIRED_FIELD'))
    });
  }

  public get formValues(): FormValues<LoginFormSchema> {
    return {
      email: this.email,
      password: this.password,
    };
  }
}
