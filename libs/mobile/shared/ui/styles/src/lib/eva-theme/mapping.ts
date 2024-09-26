import { SchemaType } from '@eva-design/dss/types/schema';
import defaultEvaMapping from '@eva-design/eva/mapping';
import { PartialDeep } from 'type-fest';
import { rem } from '../styles';
import { fontFamily, colors } from '../variables';

export const mapping: PartialDeep<typeof defaultEvaMapping | SchemaType> = {
  strict: {
    'text-font-family': fontFamily.regular,
    'text-heading-1-font-size': 1.75 * rem,
    'text-heading-1-font-weight': '400',
    'text-heading-1-font-family': fontFamily.bold,
    'text-heading-2-font-size': 1.25 * rem,
    'text-heading-2-font-weight': '400',
    'text-heading-2-font-family': fontFamily.bold,
    'text-subtitle-1-font-size': 1.0625 * rem,
    'text-subtitle-1-font-weight': '400',
    'text-subtitle-1-font-family': fontFamily.regular,
    'text-subtitle-2-font-size': 1.0625 * rem,
    'text-subtitle-2-font-weight': '400',
    'text-subtitle-2-font-family': fontFamily.bold,
    'text-paragraph-1-font-size': rem,
    'text-paragraph-1-font-weight': 400,
    'text-paragraph-1-font-family': fontFamily.regular,
    'text-paragraph-2-font-size': rem,
    'text-paragraph-2-font-weight': 400,
    'text-paragraph-2-font-family': fontFamily.bold,
    'text-caption-1-font-size': 0.8125 * rem,
    'text-caption-1-font-weight': '400',
    'text-caption-1-font-family': fontFamily.regular,
    'text-caption-2-font-size': 0.8125 * rem,
    'text-caption-2-font-weight': '400',
    'text-caption-2-font-family': fontFamily.bold,
    'text-label-font-size': rem,
    'text-label-font-weight': '400',
    'text-label-font-family': fontFamily.regular,
  },
  components: {
    Text: {
      meta: {
        scope: 'all',
        parameters: {
          lineHeight: {
            type: 'number',
          },
        },
        appearances: {},
        variantGroups: {
          category: {
            xs1: {
              default: false,
            },
            xs2: {
              default: false,
            },
          },
        },
      },
      appearances: {
        default: {
          mapping: {},
          variantGroups: {
            category: {
              h1: {
                lineHeight: 2 * rem,
              },
              h2: {
                lineHeight: 1.5 * rem,
              },
              s1: {
                lineHeight: 1.5 * rem,
              },
              s2: {
                lineHeight: 1.375 * rem,
              },
              p1: {
                lineHeight: 1.25 * rem,
              },
              p2: {
                lineHeight: 1.25 * rem,
              },
              c1: {
                lineHeight: rem,
              },
              c2: {
                lineHeight: rem,
              },
              xs1: {
                fontFamily: fontFamily.regular,
                fontSize: 0.6875 * rem,
                lineHeight: rem,
              },
              xs2: {
                fontFamily: fontFamily.bold,
                fontSize: 0.6875 * rem,
                lineHeight: rem,
              },
            },
            status: {
              basic: {
                color: colors.textPrimary,
              },
              danger: {
                color: colors.error,
              },
            },
          },
        },
      },
    },
    Button: {
      meta: {
        parameters: {
          opacity: {
            type: 'number',
          },
          height: {
            type: 'number',
          },
        },
        variantGroups: {
          size: {
            medium: {
              default: false,
            },
            large: {
              default: true,
            },
          },
        },
      },
      appearances: {
        filled: {
          mapping: {},
          variantGroups: {
            status: {
              primary: {
                textColor: colors.textPrimary,
                borderWidth: 1,
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                state: {
                  active: {
                    backgroundColor: colors.primaryPressed,
                    borderColor: colors.primaryPressed,
                    borderWidth: 1,
                  },
                  disabled: {
                    backgroundColor: colors.textTertriary,
                    borderColor: colors.textTertriary,
                    borderWidth: 1,
                    textColor: colors.textSecondary,
                  },
                },
              },
              basic: {
                textColor: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.backgroundTertiary,
                backgroundColor: colors.backgroundTertiary,
                state: {
                  active: {
                    textColor: colors.textPrimary,
                    borderColor: colors.textTertriary,
                    backgroundColor: colors.textTertriary,
                  },
                  disabled: {
                    backgroundColor: colors.backgroundTertiary,
                    borderColor: colors.backgroundTertiary,
                    borderWidth: 1,
                    textColor: colors.textSecondary,
                  },
                },
              },
            },
            size: {
              large: {
                textFontFamily: fontFamily.bold,
                textFontSize: rem,
                textFontWeight: '700',
                borderRadius: 12,
                borderWidth: 1,
                minHeight: 64,
                minWidth: 64,
                paddingHorizontal: 0,
                paddingVertical: 0,
                iconMarginHorizontal: 0,
                iconWidth: 'auto',
                iconHeight: 'auto',
              },
              medium: {
                textFontFamily: fontFamily.bold,
                textFontSize: rem,
                textFontWeight: '700',
                borderRadius: 12,
                borderWidth: 1,
                minHeight: 60,
                minWidth: 60,
                paddingHorizontal: 0,
                paddingVertical: 0,
                iconMarginHorizontal: 0,
                iconWidth: 'auto',
                iconHeight: 'auto',
              },
              small: {
                textFontFamily: fontFamily.bold,
                textFontSize: 0.8125 * rem,
                textFontWeight: '700',
                minHeight: 40,
                minWidth: 40,
                borderRadius: 12,
                borderWidth: 1,
              },
            },
          },
        },
        ghost: {
          variantGroups: {
            status: {
              primary: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: colors.primary,
                state: {
                  active: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: colors.primaryPressed,
                  },
                  disabled: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: colors.textSecondary,
                  },
                },
              },
              basic: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: colors.textPrimary,
                state: {
                  active: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: colors.textSecondary,
                  },
                  disabled: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: colors.textSecondary,
                  },
                },
              },
            },
          },
        },
      },
    },
    Input: {
      appearances: {
        default: {
          mapping: {
            textFontFamily: fontFamily.regular,
            textFontSize: rem,
            captionFontWeight: '400',
          },
          variantGroups: {
            status: {
              primary: {
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.backgroundTertiary,
                textColor: colors.textPrimary,
                placeholderColor: colors.textSecondary,
                state: {
                  focused: {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.textSecondary,
                  },
                },
              },
              danger: {
                backgroundColor: colors.backgroundTertiary,
                borderColor: colors.error,
                textColor: colors.textSecondary,
                placeholderColor: colors.textTertriary,
                state: {
                  focused: {
                    textColor: colors.textPrimary,
                    placeholderColor: colors.textSecondary,
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.error,
                  },
                },
              },
            },
            size: {
              medium: {
                minHeight: 60,
                textFontSize: rem,
                borderRadius: 12,
                paddingVertical: 7,
                paddingHorizontal: 9,
              },
            },
          },
        },
      },
    },
    Avatar: {
      appearances: {
        default: {
          variantGroups: {
            size: {
              large: {
                height: 6.75 * rem,
                width: 6.75 * rem,
              },
              medium: {
                height: 2.5 * rem,
                width: 2.5 * rem,
              },
              small: {
                height: 1.5 * rem,
                width: 1.5 * rem,
              },
              tiny: {
                height: rem,
                width: rem,
              },
            },
          },
        },
      },
    },
  },
};
