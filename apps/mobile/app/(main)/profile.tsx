import { useRouter } from 'expo-router';
import React, { ReactElement } from 'react';
// import { ProfileDetails } from '@example/mobile/profile/features/details';
import { commonStyle, createStyles } from '@example/mobile/shared/ui/styles';
import { AppScreen } from '@example/mobile/shared/ui/ui-kit';

export default function ProfileScreen(): ReactElement {
  const router = useRouter();

  const handleLogout = (): void => {
    router.replace('/'); //TODO add auth guard
  };

  return (
    <AppScreen style={[commonStyle.container, style.container]} testID='profile-screen'>
      {/* <ProfileDetails onLogout={handleLogout} /> */}
    </AppScreen>
  );
}

const style = createStyles({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly'
  }
});
