import { AppButton, AppScreen, AppSpinner, AppText, AppTextInput } from '@ronas-it/mobile/shared/ui/ui-kit';
import { ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native-unistyles';

export default function UiKitScreen(): ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
      <AppTextInput
        label='Username'
        autoCapitalize='none'
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
      />
      <AppTextInput isPassword={true} label='Password' value={password} onChangeText={setPassword} />
      <AppButton text='Button Primary Regular' />
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
}));
