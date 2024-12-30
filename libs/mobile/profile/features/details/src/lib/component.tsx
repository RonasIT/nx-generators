import { useTranslation } from '@ronas-it/react-native-common-modules';
import { Image } from 'expo-image';
import React, { Fragment, ReactElement } from 'react';
import { View } from 'react-native';
import { authApi, profileApi } from '@ronas-it/mobile/shared/data-access/api';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { commonStyle, createStyles } from '@ronas-it/mobile/shared/ui/styles';
import { AppText, AppButton, AppSpinner } from '@ronas-it/mobile/shared/ui/ui-kit';

export function ProfileDetails(): ReactElement {
  const translate = useTranslation('PROFILE.DETAILS');
  const { data: profile } = profileApi.useGetProfileQuery();
  const [logout, { isLoading }] = authApi.useLogoutMutation();
  const avatarSrc = profile?.avatar ? { uri: profile.avatar.media.link } : Images.logo;

  return (
    <Fragment>
      <View style={commonStyle.fullFlex}>
        {profile ? (
          <View style={styles.profile}>
            <AppText category='h1'>{translate('TEXT_GREETING', { name: profile.nickname })}</AppText>
            <Image source={avatarSrc} style={styles.photo} />
            <View>
              <AppText>{translate('TEXT_EMAIL', { email: profile.email })}</AppText>
              {profile.username && <AppText>{translate('TEXT_NAME', { name: profile.username })}</AppText>}
            </View>
          </View>
        ) : (
          <AppSpinner />
        )}
      </View>
      <AppButton onPress={() => logout()} title={translate('BUTTON_LOGOUT')} isLoading={isLoading} />
    </Fragment>
  );
}

const styles = createStyles({
  profile: {
    gap: '1rem',
  },
  photo: {
    alignSelf: 'center',
    width: '75%',
    aspectRatio: 1,
    overflow: 'hidden',
    textAlign: 'center',
  },
});
