'use client';

import React from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { Text, Button, TextInput, Switch, Row, Column } from '../../components';
import styles from './page.module.css';

export default function SignInPage() {
  const { signIn, setActive: setSignInActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSignUp, setIsSignUp] = React.useState(false);

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
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Text variant="title" className={styles.title}>AI Companion</Text>
        <Text variant="subtitle" className={styles.subtitle}>Your personal AI assistant</Text>
      </div>

      <div className={styles.signInContainer}>
        <Row justifyContent="center" alignItems="center" className={styles.switchContainer}>
          <Text>Sign In</Text>
          <Switch 
            value={isSignUp} 
            onValueChange={setIsSignUp} 
          />
          <Text>Sign Up</Text>
        </Row>

        <TextInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoCapitalize="none"
          className={styles.input}
          disabled={loading}
        />
        
        <TextInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className={styles.input}
          disabled={loading}
        />
        
        {error ? <Text className={styles.errorText}>{error}</Text> : null}
        
        <Button
          mode="contained"
          loading={loading}
          disabled={loading || !email.trim() || !password.trim() || 
                  (!isSignInLoaded && !isSignUp) || (!isSignUpLoaded && isSignUp)}
          onClick={handleAuth}
          className={styles.authButton}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
      </div>
    </div>
  );
}