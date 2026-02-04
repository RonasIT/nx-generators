import { ReactElement } from 'react';
import { Text, type TextProps } from 'react-native';
import { UnistylesVariants, StyleSheet } from 'react-native-unistyles';
import { fontFamily, rem } from '@ronas-it/mobile/shared/ui/styles';

export type AppTextProps = UnistylesVariants<typeof textStyles> & TextProps;

export const AppText = ({ variant = 'bodyDefault', children, style, ...props }: AppTextProps): ReactElement => {
  textStyles.useVariants({ variant });

  return (
    <Text style={[textStyles.text, style]} {...props}>
      {children}
    </Text>
  );
};

export const textStyles = StyleSheet.create(({ colors }) => ({
  text: {
    color: colors.textPrimary,
    variants: {
      variant: {
        // Titles
        h1: {
          fontFamily: fontFamily.regular,
          fontSize: 1.5 * rem, // 24px
          lineHeight: 1.875 * rem, // 30px
          fontWeight: 500,
        },
        h2: {
          fontFamily: fontFamily.regular,
          fontSize: 1.375 * rem, // 22px
          lineHeight: 1.75 * rem, // 28px
        },
        h3: {
          fontFamily: fontFamily.regular,
          fontSize: 1.1875 * rem, // 19px
          lineHeight: 1.5 * rem, // 24px
        },
        h4: {
          fontFamily: fontFamily.regular,
          fontSize: 1.1875 * rem, // 19px
          lineHeight: 1.5 * rem, // 24px
          fontWeight: 500,
        },
        h5: {
          fontFamily: fontFamily.regular,
          fontSize: 1 * rem, // 16px
          lineHeight: 1.25 * rem, // 20px
          fontWeight: 500,
        },
        h6: {
          fontFamily: fontFamily.regular,
          fontSize: 1 * rem, // 16px
          lineHeight: 1.25 * rem, // 20px
          fontWeight: 500,
        },

        // Body
        bodyLarge: {
          fontFamily: fontFamily.regular,
          fontSize: 1.0625 * rem, // 17px
          lineHeight: 1.5 * rem, // 24px
        },
        bodyLargeBold: {
          fontFamily: fontFamily.bold,
          fontSize: 1.0625 * rem, // 17px
          lineHeight: 1.5 * rem, // 24px
          fontWeight: 500,
        },
        bodyDefault: {
          fontFamily: fontFamily.regular,
          fontSize: 1 * rem, // 16px
          lineHeight: 1.4375 * rem, // 23px
        },
        bodyDefaultBold: {
          fontFamily: fontFamily.bold,
          fontSize: 1 * rem, // 16px
          lineHeight: 1.4375 * rem, // 23px
          fontWeight: 500,
        },
        bodySmall: {
          fontFamily: fontFamily.regular,
          fontSize: 0.8125 * rem, // 13px
          lineHeight: 1.1875 * rem, // 19px
        },
        bodySmallBold: {
          fontFamily: fontFamily.semiBold,
          fontSize: 0.8125 * rem, // 13px
          lineHeight: 1.1875 * rem, // 19px
          fontWeight: 500,
        },
        bodyExtraSmall: {
          fontFamily: fontFamily.regular,
          fontSize: 0.6875 * rem, // 11px
          lineHeight: 0.875 * rem, // 14px
        },
        bodyExtraSmallBold: {
          fontFamily: fontFamily.semiBold,
          fontSize: 0.6875 * rem, // 11px
          lineHeight: 0.875 * rem, // 14px
          fontWeight: 500,
        },
      },
    },
  },
}));
