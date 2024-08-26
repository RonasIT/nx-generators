import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from '@ronas-it/react-native-common-modules/src/utils/i18n';
import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
// import { Image } from 'expo-image';
import { authApi } from '@example/mobile/shared/data-access/api';
import { createStyles } from '@example/mobile/shared/ui/styles';
import { AppVersion } from '@example/mobile/shared/ui/app-version';
import { AppButton, AppText, FormTextInput } from '@example/mobile/shared/ui/ui-kit';
import { LoginFormSchema } from './forms';
import { FormValues } from '@example/mobile/shared/utils/form';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps): JSX.Element {
  const translate = useTranslation('AUTH.LOGIN_FORM');
  const formSchema = new LoginFormSchema();
  const [login, { isLoading, isSuccess }] = authApi.useLoginMutation();
  const appName = Constants?.expoConfig?.name;

  const onSubmit = (form: FormValues<LoginFormSchema>) => login(form);

  const form = useForm<LoginFormSchema>({
    defaultValues: formSchema.formValues,
    resolver: yupResolver<any>(LoginFormSchema.validationSchema)
  });
  const { handleSubmit, formState, control } = form;

  useEffect(() => {
    if (isSuccess) {
      onLoginSuccess();
    }
  }, [isSuccess]);

  return (
    <ScrollView contentContainerStyle={style.content}>
      {/* <Image source={require('@example/shared/ui/ui-kit/assets/images/logo.png')} style={style.logo} /> */}
      <AppText style={style.title} category='h1'>
        {translate('TEXT_TITLE', { value: appName })}
      </AppText>
      <FormTextInput<LoginFormSchema>
        label={translate('TEXT_LOGIN')}
        name='email'
        testID='email-input'
        autoCapitalize='none'
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
      <View style={style.footer}>
        <AppButton
          onPress={handleSubmit(onSubmit)}
          status='basic'
          isLoading={isLoading}
          disabled={!formState.isValid}
          testID='submit-button'
          title={translate('BUTTON_SUBMIT')} />
      </View>
      <AppVersion />
    </ScrollView>
  );
}

const style = createStyles({
  content: {
    paddingTop: '2rem'
  },
  logo: {
    width: '3.5rem',
    height: '3.5rem'
  },
  title: {
    marginVertical: '2rem'
  },
  footer: {
    marginTop: '2rem'
  }
});
