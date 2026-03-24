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
      <AppText>Title H1</AppText>
      <AppText>Title H2</AppText>
      <AppText>Title H3</AppText>
      <AppText>Title H4</AppText>
      <AppText>Title H5</AppText>
      <AppText>Title H6</AppText>
      <AppText>Body Large</AppText>
      <AppText>Body Large Bold</AppText>
      <AppText>Body Default</AppText>
      <AppText>Body Default Bold</AppText>
      <AppText>Body Small</AppText>
      <AppText>Body Small Bold</AppText>
      <AppText>Body Extra Small</AppText>
      <AppText>Body Extra Small Bold</AppText>
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
