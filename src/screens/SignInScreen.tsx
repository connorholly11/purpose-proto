import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, Switch } from 'react-native-paper';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import LegalModal from './LegalModal';

export const SignInScreen = () => {
  const navigation = useNavigation();
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [currentLegalDoc, setCurrentLegalDoc] = useState<'terms' | 'privacy'>('terms');

  const openLegal = (docType: 'terms' | 'privacy') => {
    setCurrentLegalDoc(docType);
    setLegalModalVisible(true);
  };
  
  const handleAuth = React.useCallback(async () => {
    if (
      (!isSignInLoaded && !isSignUp) || 
      (!isSignUpLoaded && isSignUp) || 
      !email.trim() || 
      !password.trim() || 
      (isSignUp && !signUp) || 
      (!isSignUp && !signIn)
    ) return;
    
    try {
      setLoading(true);
      setError('');
      
      if (isSignUp && signUp) {
        // Sign up process
        const signUpAttempt = await signUp.create({
          emailAddress: email,
          password,
        });

        // Automatically verify email (this skips the verification step)
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        
        // Create session after sign up
        if (signUpAttempt.status === 'complete') {
          await setSignUpActive({ session: signUpAttempt.createdSessionId });
        } else {
          // This can happen if Clerk requires email verification
          console.error(JSON.stringify(signUpAttempt, null, 2));
          setError('Sign-up incomplete. You may need to verify your email.');
        }
      } else if (!isSignUp && signIn) {
        // Sign in process
        const signInAttempt = await signIn.create({
          identifier: email,
          password,
        });
        
        if (signInAttempt.status === 'complete') {
          await setSignInActive({ session: signInAttempt.createdSessionId });
        } else {
          console.error(JSON.stringify(signInAttempt, null, 2));
          setError('Sign-in incomplete. Please try again.');
        }
      }
    } catch (err: any) {
      console.error(isSignUp ? "Sign-up error:" : "Sign-in error:", err);
      setError(`Failed to ${isSignUp ? 'sign up' : 'sign in'}. ${err?.message || 'Please check your credentials and try again.'}`);
    } finally {
      setLoading(false);
    }
  }, [isSignInLoaded, isSignUpLoaded, isSignUp, email, password, signIn, signUp, setSignInActive, setSignUpActive]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>AI Companion</Text>
        <Text style={styles.subtitle}>Your personal AI assistant</Text>
      </View>

      <View style={styles.signInContainer}>
        <View style={styles.switchContainer}>
          <Text>Sign In</Text>
          <Switch value={isSignUp} onValueChange={setIsSignUp} />
          <Text>Sign Up</Text>
        </View>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          disabled={loading}
        />
        
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          disabled={loading}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {isSignUp && (
          <Text style={styles.legalText}>
            By creating an account you agree to our{' '}
            <Text style={styles.link} onPress={() => openLegal('terms')}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={() => openLegal('privacy')}>
              Privacy Policy
            </Text>.
          </Text>
        )}
        
        <Button
          mode="contained"
          loading={loading}
          disabled={loading || !email.trim() || !password.trim() || 
                  (!isSignInLoaded && !isSignUp) || (!isSignUpLoaded && isSignUp)}
          onPress={handleAuth}
          style={styles.authButton}
          contentStyle={styles.authButtonContent}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
      </View>
      
      {/* Legal Document Modal */}
      <LegalModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        docType={currentLegalDoc}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  signInContainer: {
    width: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  legalText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  link: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  authButton: {
    borderRadius: 8,
    marginVertical: 8,
  },
  authButtonContent: {
    height: 48,
  },
});

export default SignInScreen; 