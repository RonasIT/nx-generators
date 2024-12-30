import { useHeaderHeight } from '@react-navigation/elements';
import { Layout } from '@ui-kitten/components';
import React, { ReactElement, useMemo } from 'react';
import { ImageBackground, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { Images } from '@ronas-it/mobile/shared/ui/assets';
import { commonStyle, createStyles, spacings } from '@ronas-it/mobile/shared/ui/styles';

export interface AppScreenProps {
  scrollDisabled?: boolean;
  noOutsideSpacing?: boolean;
  withLoader?: boolean;
  withBackgroundImage?: boolean;
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
    withBackgroundImage,
    withHeader = false,
    ...restProps
  } = props;

  const headerHeight = useHeaderHeight();

  const [ViewComponent, viewComponentProps] = useMemo(
    (): [typeof View, ViewProps] | [typeof ScrollView, ScrollViewProps] =>
      scrollDisabled
        ? [View, { style: [commonStyle.fullFlex, !noOutsideSpacing && styles.container, elementStyle], ...restProps }]
        : [
            ScrollView,
            {
              contentContainerStyle: [styles.scroll, !noOutsideSpacing && styles.container, elementStyle],
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

  return withBackgroundImage ? (
    <ImageBackground
      style={[commonStyle.fullFlex, withHeader && { paddingTop: headerHeight }]}
      source={Images.background}>
      {content}
    </ImageBackground>
  ) : (
    <Layout level='1' style={commonStyle.fullFlex} testID={testID}>
      {content}
    </Layout>
  );
}

const styles = createStyles({
  scroll: {
    minHeight: '100%',
  },
  container: {
    paddingHorizontal: spacings.containerOffset,
  },
});
