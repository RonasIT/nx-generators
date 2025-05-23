import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from '@ronas-it/react-native-common-modules';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { authApi } from '@ronas-it/mobile/shared/data-access/api';
import { AppVersion } from '@ronas-it/mobile/shared/ui/app-version';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { createStyles } from '@ronas-it/mobile/shared/ui/styles';
import { AppButton, AppText, ErrorMessage, FormTextInput } from '@ronas-it/mobile/shared/ui/ui-kit';
import { FormValues } from '@ronas-it/mobile/shared/utils/form';
import { LoginFormSchema } from './forms';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps): ReactElement {
  const translate = useTranslation('AUTH.LOGIN_FORM');
  const formSchema = new LoginFormSchema();
  const [login, { isLoading, isSuccess, error }] = authApi.useLoginMutation();
  const appName = Constants?.expoConfig?.name;

  const onSubmit = (form: FormValues<LoginFormSchema>): void => {
    login(form);
  };

  const form = useForm<LoginFormSchema>({
    defaultValues: formSchema.formValues,
    resolver: yupResolver<any>(LoginFormSchema.validationSchema),
  });
  const { handleSubmit, formState, control } = form;

  useEffect(() => {
    if (isSuccess) {
      onLoginSuccess();
    }
  }, [isSuccess]);

  return (
    <ScrollView contentContainerStyle={style.content}>
      <Image source={Images.logo} style={style.logo} />
      <AppText style={style.title} category='h1'>
        {translate('TEXT_TITLE', { value: appName })}
      </AppText>
      <View style={style.form}>
        <FormTextInput<LoginFormSchema>
          label={translate('TEXT_LOGIN')}
          name='email'
          testID='email-input'
          autoCapitalize='none'
          autoCorrect={false}
          autoComplete='email'
          keyboardType='email-address'
          control={control}
          returnKeyType='next'
        />
        <FormTextInput<LoginFormSchema>
          isPassword={true}
          testID='password-input'
          label={translate('TEXT_PASSWORD')}
          name='password'
          control={control}
          returnKeyType='done'
        />
        {!!error?.message && <ErrorMessage message={error.message} />}
      </View>

      <View style={style.footer}>
        <AppButton
          onPress={handleSubmit(onSubmit)}
          status='basic'
          isLoading={isLoading}
          disabled={!formState.isValid}
          testID='submit-button'
          title={translate('BUTTON_SUBMIT')}
        />
      </View>
      <AppVersion />
    </ScrollView>
  );
}

const style = createStyles({
  content: {
    paddingTop: '2rem',
  },
  logo: {
    width: '3.5rem',
    height: '3.5rem',
    alignSelf: 'center',
  },
  title: {
    marginVertical: '2rem',
  },
  form: {
    gap: '0.5rem',
  },
  footer: {
    marginTop: '2rem',
  },
});
