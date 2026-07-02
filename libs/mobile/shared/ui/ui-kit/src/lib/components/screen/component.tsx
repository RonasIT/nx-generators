import { useHeaderHeight } from 'expo-router/react-navigation';
import { ReactElement, useMemo } from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { commonStyle, spacings } from '@ronas-it/mobile/shared/ui/styles';

export interface AppScreenProps {
  scrollDisabled?: boolean;
  noOutsideSpacing?: boolean;
  withHeader?: boolean;
}

interface NonScrollableScreenProps extends ViewProps {
  scrollDisabled: true;
}

interface ScrollableScreenProps extends ScrollViewProps {
  scrollDisabled?: false;
}

export function AppScreen(props: AppScreenProps & (ScrollableScreenProps | NonScrollableScreenProps)): ReactElement {
  const {
    children,
    style: elementStyle = {},
    testID,
    scrollDisabled,
    noOutsideSpacing,
    withHeader = false,
    ...restProps
  } = props;

  const headerHeight = useHeaderHeight();

  const [ViewComponent, viewComponentProps] = useMemo(
    (): [typeof View, ViewProps] | [typeof ScrollView, ScrollViewProps] =>
      scrollDisabled
        ? [
            View,
            {
              style: [commonStyle.fullFlex, !noOutsideSpacing && styles.spacingsContainer, elementStyle],
              ...restProps,
            },
          ]
        : [
            ScrollView,
            {
              contentContainerStyle: [styles.scroll, !noOutsideSpacing && styles.spacingsContainer, elementStyle],
              showsVerticalScrollIndicator: false,
              keyboardShouldPersistTaps: 'handled',
              ...restProps,
            },
          ],
    [scrollDisabled, restProps, noOutsideSpacing],
  );

  const content = useMemo(
    () => <ViewComponent {...viewComponentProps}>{children}</ViewComponent>,
    [children, viewComponentProps],
  );

  return (
    <View style={[commonStyle.fullFlex, styles.container, withHeader && { paddingTop: headerHeight }]} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create(({ colors }) => ({
  container: {
    backgroundColor: colors.backgroundPrimary,
  },
  scroll: {
    minHeight: '100%',
  },
  spacingsContainer: {
    paddingHorizontal: spacings.md,
  },
}));
