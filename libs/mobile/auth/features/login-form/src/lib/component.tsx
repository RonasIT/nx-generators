import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from '@ronas-it/react-native-common-modules/i18n';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ReactElement, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { authApi } from '@ronas-it/mobile/shared/data-access/api';
import { AppVersion } from '@ronas-it/mobile/shared/ui/app-version';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { rem } from '@ronas-it/mobile/shared/ui/styles';
import { AppButton, AppText, ErrorMessage, FormTextInput, AppImage } from '@ronas-it/mobile/shared/ui/ui-kit';
import { FormValues } from '@ronas-it/mobile/shared/utils/form';
import { navigationConfig } from '@ronas-it/mobile/shared/utils/navigation';
import { LoginFormSchema } from './forms';

export function LoginForm(): ReactElement {
  const translate = useTranslation('AUTH.LOGIN_FORM');
  const formSchema = new LoginFormSchema();
  const [login, { isLoading, isSuccess, error }] = authApi.useLoginMutation();
  const appName = Constants?.expoConfig?.name;
  const router = useRouter();

  const onSubmit = (form: FormValues<LoginFormSchema>): void => {
    login(form);
  };

  const { control, handleSubmit, formState } = useForm({
    defaultValues: formSchema.formValues,
    resolver: yupResolver(LoginFormSchema.validationSchema),
  });

  useEffect(() => {
    if (isSuccess) {
      router.replace(`/${navigationConfig.main.root}`);
    }
  }, [isSuccess]);

  return (
    <View style={style.content}>
      <AppImage source={Images.logo} style={style.logo} />
      <AppText style={style.title} variant='h1'>
        {translate('TEXT_TITLE', { value: appName })}
      </AppText>
      <View style={style.form}>
        <FormTextInput
          label={translate('TEXT_USERNAME')}
          name='username'
          testID='username-input'
          autoCapitalize='none'
          autoCorrect={false}
          control={control}
          returnKeyType='next'
        />
        <FormTextInput
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
          isLoading={isLoading}
          disabled={!formState.isValid}
          testID='submit-button'
          text={translate('BUTTON_SUBMIT')}
        />
      </View>
      <AppVersion />
    </View>
  );
}

const style = StyleSheet.create(({ spacings }) => ({
  content: {
    paddingTop: spacings['4xl'],
  },
  logo: {
    width: 3.5 * rem,
    height: 3.5 * rem,
    alignSelf: 'center',
  },
  title: {
    marginVertical: spacings['4xl'],
    textAlign: 'center',
  },
  form: {
    gap: spacings.sm,
  },
  footer: {
    marginVertical: spacings['4xl'],
  },
}));
