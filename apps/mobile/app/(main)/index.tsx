import { ProfileDetails } from '@ronas-it/mobile/profile/features/details';
import { commonStyle } from '@ronas-it/mobile/shared/ui/styles';
import { AppScreen } from '@ronas-it/mobile/shared/ui/ui-kit';
import { ReactElement } from 'react';

export default function ProfileScreen(): ReactElement {
  return (
    <AppScreen style={commonStyle.container} testID='profile-screen'>
      <ProfileDetails />
    </AppScreen>
  );
}
