import { Switch } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function ThemedSwitch({ value, onValueChange }: ThemedSwitchProps) {
  const { theme } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
      thumbColor={value ? theme.colors.primary : '#f4f3f4'}
    />
  );
}
