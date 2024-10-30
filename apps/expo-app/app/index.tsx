import { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { createStyles } from '@ronas-it/expo-app/shared/ui/styles';

export default function RootScreen(): ReactElement {
  return (
    <View style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
