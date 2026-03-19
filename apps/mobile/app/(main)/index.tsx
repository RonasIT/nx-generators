import { ProfileDetails } from '@ronas-it/mobile/profile/features/details';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { navigationConfig } from '@ronas-it/mobile/shared/utils/navigation';
import { router } from 'expo-router';
import { ReactElement } from 'react';

export default function ProfileScreen(): ReactElement {
  const goToUiKitScreen = (): void => {
    router.navigate(`/${navigationConfig.main.root}/${navigationConfig.main['ui-kit']}`);
  };

  return (
    <AppScreen testID='profile-screen' scrollDisabled>
      <ProfileDetails goToUiKitScreen={goToUiKitScreen} />
    </AppScreen>
  );
}
