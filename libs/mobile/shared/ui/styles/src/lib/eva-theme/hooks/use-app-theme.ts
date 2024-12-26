import { useTheme } from '@ui-kitten/components';
import { Theme } from '../theme';

export const useAppTheme = useTheme as () => Theme;
