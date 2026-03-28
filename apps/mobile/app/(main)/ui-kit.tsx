import {
  AppButton,
  AppCheckbox,
  AppScreen,
  AppSpinner,
  AppText,
  AppTextInput,
  SearchInput,
} from '@ronas-it/mobile/shared/ui/ui-kit';
import { ToastService } from '@ronas-it/mobile/shared/utils/toast-service';
import { ReactElement, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export default function UiKitScreen(): ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <AppScreen style={styles.container}>
      <AppText variant='h1'>Title H1</AppText>
      <AppText variant='h2'>Title H2</AppText>
      <AppText variant='h3'>Title H3</AppText>
      <AppText variant='h4'>Title H4</AppText>
      <AppText variant='h5'>Title H5</AppText>
      <AppText variant='h6'>Title H6</AppText>
      <AppText variant='bodyLarge'>Body Large</AppText>
      <AppText variant='bodyLargeBold'>Body Large Bold</AppText>
      <AppText variant='bodyDefault'>Body Default</AppText>
      <AppText variant='bodyDefaultBold'>Body Default Bold</AppText>
      <AppText variant='bodySmall'>Body Small</AppText>
      <AppText variant='bodySmallBold'>Body Small Bold</AppText>
      <AppText variant='bodyExtraSmall'>Body Extra Small</AppText>
      <AppText variant='bodyExtraSmallBold'>Body Extra Small Bold</AppText>
      <View style={styles.checkbox}>
        <AppCheckbox value={isChecked} onValueChange={setIsChecked} />
        <AppText>Checkbox</AppText>
      </View>
      <AppTextInput
        label='Username'
        autoCapitalize='none'
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <AppTextInput isPassword={true} label='Password' value={password} onChangeText={setPassword} />
      <SearchInput
        placeholder='Search'
        value={searchValue}
        onChangeText={setSearchValue}
        onClearPress={() => setSearchValue('')}
      />
      <AppButton text='Button Primary Regular (show toast)' onPress={ToastService.showFeatureNotImplemented} />
      <AppButton text='Button Primary Small' size='small' />
      <AppButton text='Button Secondary Regular' variant='secondary' />
      <AppButton text='Button Secondary Small' variant='secondary' size='small' />
      <AppButton text='Button Tertiary Regular' variant='tertiary' />
      <AppButton text='Button Tertiary Small' variant='tertiary' size='small' />
      <AppButton text='Button Danger Regular' variant='danger' />
      <AppButton text='Button Danger Small' variant='danger' size='small' />
      <AppSpinner />
    </AppScreen>
  );
}

const styles = StyleSheet.create(({ spacings }) => ({
  container: {
    gap: spacings.xs,
    paddingVertical: spacings.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacings.xs,
  },
}));
