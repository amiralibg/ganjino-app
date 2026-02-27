import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '@/store/useAuthStore';
import { useSignIn, useSignUp } from '@/lib/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { TEXT } from '@/constants/text';
import WalletIcon from '@/components/icons/WalletIcon';
import { useNetInfo } from '@react-native-community/netinfo';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: false,
    password: false,
    name: false,
  });

  const setUser = useAuthStore((state) => state.setUser);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const { theme } = useTheme();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;

  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();

  // Memoized styles for dynamic theming
  const nameInputStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
      borderColor: errors.name ? '#EF4444' : theme.colors.cardBorder,
    }),
    [errors.name, theme.colors.card, theme.colors.text, theme.colors.cardBorder]
  );

  const emailInputStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
      borderColor: errors.email ? '#EF4444' : theme.colors.cardBorder,
    }),
    [errors.email, theme.colors.card, theme.colors.text, theme.colors.cardBorder]
  );

  const passwordInputStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
      borderColor: errors.password ? '#EF4444' : theme.colors.cardBorder,
    }),
    [errors.password, theme.colors.card, theme.colors.text, theme.colors.cardBorder]
  );

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    setErrors({ email: false, password: false, name: false });
  }, [isSignUp]);

  const resolveApiError = (error: unknown): string => {
    const responseError = (error as { response?: { data?: unknown } })?.response?.data;
    if (!responseError) {
      return TEXT.auth.serverUnavailable;
    }

    const data = responseError as {
      error?: string;
      errors?: Array<{ msg?: string }>;
    };

    if (data.error) {
      return data.error;
    }

    if (data.errors && data.errors.length > 0 && data.errors[0].msg) {
      return data.errors[0].msg;
    }

    return TEXT.auth.serverUnavailable;
  };

  const handleAuth = async () => {
    if (isOffline) {
      showToast.error(TEXT.common.error, TEXT.auth.offlineMessage);
      return;
    }

    // Reset errors
    const newErrors = {
      email: false,
      password: false,
      name: false,
    };

    // Validate inputs
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      newErrors.email = true;
    }

    if (!password) {
      newErrors.password = true;
    }

    if (isSignUp && !trimmedName) {
      newErrors.name = true;
    }

    // Update error state
    setErrors(newErrors);

    // Check if there are any errors
    if (newErrors.email || newErrors.password || newErrors.name) {
      if (!trimmedEmail || !password || (isSignUp && !trimmedName)) {
        showToast.error(TEXT.common.error, TEXT.auth.fillAllFields);
      } else if (newErrors.email) {
        showToast.error(TEXT.common.error, TEXT.auth.invalidEmail);
      } else if (isSignUp && password.length < 6) {
        showToast.error(TEXT.common.error, TEXT.auth.passwordTooShort);
      } else if (isSignUp && trimmedName.length < 2) {
        showToast.error(TEXT.common.error, TEXT.auth.nameTooShort);
      }
      return;
    }

    if (isSignUp && password.length < 6) {
      showToast.error(TEXT.common.error, TEXT.auth.passwordTooShort);
      return;
    }

    if (isSignUp && trimmedName.length < 2) {
      showToast.error(TEXT.common.error, TEXT.auth.nameTooShort);
      return;
    }

    try {
      if (isSignUp) {
        const result = await signUpMutation.mutateAsync({
          email: trimmedEmail.toLowerCase(),
          password,
          name: trimmedName,
        });
        setUser(result.user);
        setAuthenticated(true);
      } else {
        const result = await signInMutation.mutateAsync({
          email: trimmedEmail.toLowerCase(),
          password,
        });
        setUser(result.user);
        setAuthenticated(true);
      }
    } catch (error: unknown) {
      showToast.error(TEXT.common.error, resolveApiError(error));
    }
  };

  const loading = signInMutation.isPending || signUpMutation.isPending;

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <WalletIcon size={48} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: 'Vazirmatn_700Bold' }]}>
          {TEXT.auth.appName}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, fontFamily: 'Vazirmatn_400Regular' },
          ]}
        >
          {TEXT.auth.appTagline}
        </Text>
      </View>

      <View style={styles.form}>
        {isSignUp && (
          <TextInput
            style={[styles.input, nameInputStyle, { fontFamily: 'Vazirmatn_400Regular' }]}
            placeholder={TEXT.auth.name}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name && text) {
                setErrors({ ...errors, name: false });
              }
            }}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            placeholderTextColor={theme.colors.textTertiary}
          />
        )}

        <TextInput
          style={[styles.input, emailInputStyle, { fontFamily: 'Vazirmatn_400Regular' }]}
          placeholder={TEXT.auth.email}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email && text) {
              setErrors({ ...errors, email: false });
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          placeholderTextColor={theme.colors.textTertiary}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.passwordInput,
              passwordInputStyle,
              { fontFamily: 'Vazirmatn_400Regular' },
            ]}
            placeholder={TEXT.auth.password}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password && text) {
                setErrors({ ...errors, password: false });
              }
            }}
            secureTextEntry={!showPassword}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleAuth();
            }}
            placeholderTextColor={theme.colors.textTertiary}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            loading && styles.buttonDisabled,
            isOffline && styles.buttonDisabled,
          ]}
          onPress={handleAuth}
          disabled={loading || isOffline}
        >
          <Text
            style={[
              styles.buttonText,
              { color: theme.colors.background, fontFamily: 'Vazirmatn_700Bold' },
            ]}
          >
            {loading ? TEXT.common.loading : isSignUp ? TEXT.auth.signUp : TEXT.auth.signIn}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
          <Text
            style={[
              styles.switchButtonText,
              { color: theme.colors.primary, fontFamily: 'Vazirmatn_400Regular' },
            ]}
          >
            {isSignUp ? TEXT.auth.alreadyHaveAccount : TEXT.auth.noAccount}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
  },
  container: {
    flex: 1,
  },
  eyeIcon: {
    left: 16,
    padding: 4,
    position: 'absolute',
    top: 16,
  },
  form: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: 24,
    width: 96,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 16,
    textAlign: 'right',
  },
  passwordContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  passwordInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    padding: 16,
    textAlign: 'right',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  switchButtonText: {
    fontSize: 14,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
});
