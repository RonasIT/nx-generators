import { useTranslation } from '@ronas-it/react-native-common-modules/i18n';
import { AppSafeAreaView } from '@ronas-it/react-native-common-modules/safe-area-view';
import { Image } from 'expo-image';
import { ReactElement } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { authApi, profileApi } from '@ronas-it/mobile/shared/data-access/api';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { rem } from '@ronas-it/mobile/shared/ui/styles';
import { AppText, AppButton, AppSpinner } from '@ronas-it/mobile/shared/ui/ui-kit';

export interface ProfileDetailsProps {
  goToUiKitScreen: () => void;
}

export function ProfileDetails({ goToUiKitScreen }: ProfileDetailsProps): ReactElement {
  const translate = useTranslation('PROFILE.DETAILS');

  const { data: profile } = profileApi.useGetProfileQuery();
  const [logout, { isLoading }] = authApi.useLogoutMutation();

  const avatarSrc = profile?.image ? { uri: profile.image } : Images.logo;

  return profile ? (
    <AppSafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.profile}>
        <AppText variant='h1' style={styles.title}>
          {translate('TEXT_GREETING', { name: profile.username })}
        </AppText>
        <Image source={avatarSrc} style={styles.photo} />
        <View>
          <AppText>{translate('TEXT_EMAIL', { email: profile.email })}</AppText>
          {(profile.firstName || profile.lastName) && (
            <AppText>{translate('TEXT_NAME', { name: `${profile.firstName} ${profile.lastName}` })}</AppText>
          )}
        </View>
      </View>
      <AppButton onPress={goToUiKitScreen} text={translate('BUTTON_SHOW_UI_KIT')} />
      <AppButton onPress={() => logout()} text={translate('BUTTON_LOGOUT')} isLoading={isLoading} />
    </AppSafeAreaView>
  ) : (
    <AppSpinner isFullScreen />
  );
}

const styles = StyleSheet.create(({ spacings }) => ({
  container: {
    flex: 1,
    gap: spacings.md,
    paddingTop: spacings.md,
    paddingBottom: spacings.md,
  },
  profile: {
    gap: 1 * rem,
  },
  photo: {
    alignSelf: 'center',
    width: '75%',
    aspectRatio: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
}));
