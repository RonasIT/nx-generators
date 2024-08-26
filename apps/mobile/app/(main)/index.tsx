import React, { ReactElement } from 'react';
import { ProfileDetails } from '@example/mobile/profile/features/details';
import { commonStyle } from '@example/mobile/shared/ui/styles';
import { AppScreen } from '@example/mobile/shared/ui/ui-kit';

export default function ProfileScreen(): ReactElement {
  return (
    <AppScreen style={commonStyle.container} testID='profile-screen'>
      <ProfileDetails />
    </AppScreen>
  );
}
