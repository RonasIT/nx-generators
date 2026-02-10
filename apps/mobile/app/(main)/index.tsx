import { ProfileDetails } from '@ronas-it/mobile/profile/features/details';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { ReactElement } from 'react';

export default function ProfileScreen(): ReactElement {
  return (
    <AppScreen testID='profile-screen' scrollDisabled>
      <ProfileDetails />
    </AppScreen>
  );
}
