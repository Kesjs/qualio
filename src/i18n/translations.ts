export const translations = {
  en: {
    auth: {
      password: { title: 'Sign in to Qualio', description: 'Turn customer feedback into clear decisions.' },
      register: { title: 'Create your Qualio account', description: 'Start collecting and understanding customer feedback.' },
      forgot: { title: 'Reset your password', description: 'We will send you a secure reset link.' },
      otp: { title: 'Sign in with a code', description: 'Receive a one-time code by email.' },
      otpVerify: { title: 'Enter your code', description: 'The code was sent to your email.' },
      verifyEmail: { title: 'Check your email', description: 'Confirm your email to open your Qualio space.' },
      resetPassword: { title: 'Choose a new password', description: 'Use at least eight characters.' },
      labels: {
        email: 'Email', emailPlaceholder: 'you@example.com', password: 'Password', passwordPlaceholderSignIn: 'Your password', passwordPlaceholderSignUp: 'At least 8 characters',
        forgot: 'Forgot password?', signIn: 'Sign in', signUp: 'Create an account', noAccount: 'No account yet?', alreadyHave: 'Already have an account?', createAccount: 'Create my account',
        continueWithGoogle: 'Continue with Google', signInOtp: 'Use an email code', sendReset: 'Send reset link', backToSignIn: 'Back to sign in', codeSentTo: 'A code was sent to', sendCode: 'Send me a code', signInPasswordInstead: 'Use my password instead', resendCode: 'Send another code',
        newPassword: 'New password', confirmPassword: 'Confirm password', savePassword: 'Save password', termsPre: 'By continuing, you accept the', terms: 'terms', and: 'and', privacy: 'privacy policy',
        weeklyDigestConsent: 'Receive a weekly email summary of my feedback (unsubscribe at any time)',
      },
      errors: {
        fillAll: 'Fill in all fields.', incorrect: 'Incorrect email or password.', signinFailed: 'Unable to sign in.', registerFailed: 'Unable to create your account.', accountExists: 'An account already exists with this email.',
        tooManyAttempts: 'Too many sign-up attempts. Please try again in a few minutes.', enterEmail: 'Enter your email address.', resetFailed: 'Unable to send the reset email.', passwordTooShort: 'Your password must contain at least 8 characters.', passwordMismatch: 'The passwords do not match.', passwordUpdateFailed: 'Unable to update your password.',
        authCallbackFailed: 'The authentication link could not be completed.', githubFailed: 'GitHub sign-in failed', otpFailed: 'Unable to send the code.', missingCode: 'Enter the code you received.', invalidCode: 'This code is invalid or expired.', otpVerifyFailed: 'Unable to verify the code.',
      },
      success: { signedIn: 'Signed in.', accountCreated: 'Account created.', passwordUpdated: 'Password updated.', resetSent: 'Check your email.', otpSent: 'Code sent.', otpVerified: 'Signed in.' },
    },
  },
  fr: {
    auth: {
      password: { title: 'Se connecter à Qualio', description: 'Transformez vos avis clients en décisions claires.' },
      register: { title: 'Créer votre compte Qualio', description: 'Commencez à recueillir et comprendre vos avis clients.' },
      forgot: { title: 'Réinitialiser votre mot de passe', description: 'Nous vous enverrons un lien sécurisé.' },
      otp: { title: 'Se connecter avec un code', description: 'Recevez un code à usage unique par email.' },
      otpVerify: { title: 'Saisir votre code', description: 'Le code a été envoyé par email.' },
      verifyEmail: { title: 'Vérifiez votre email', description: 'Confirmez votre email pour ouvrir votre espace Qualio.' },
      resetPassword: { title: 'Choisir un nouveau mot de passe', description: 'Utilisez au moins huit caractères.' },
      labels: {
        email: 'Email', emailPlaceholder: 'vous@exemple.com', password: 'Mot de passe', passwordPlaceholderSignIn: 'Votre mot de passe', passwordPlaceholderSignUp: '8 caractères minimum',
        forgot: 'Mot de passe oublié ?', signIn: 'Se connecter', signUp: 'Créer un compte', noAccount: 'Pas encore de compte ?', alreadyHave: 'Vous avez déjà un compte ?', createAccount: 'Créer mon compte',
        continueWithGoogle: 'Continuer avec Google', signInOtp: 'Utiliser un code par email', sendReset: 'Envoyer le lien', backToSignIn: 'Retour à la connexion', codeSentTo: 'Un code a été envoyé à', sendCode: 'Recevoir un code', signInPasswordInstead: 'Utiliser mon mot de passe', resendCode: 'Renvoyer un code',
        newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer le mot de passe', savePassword: 'Enregistrer', termsPre: 'En continuant, vous acceptez les', terms: 'conditions', and: 'et la', privacy: 'politique de confidentialité',
        weeklyDigestConsent: 'Recevoir chaque semaine le résumé de mes avis par email (désinscription possible à tout moment)',
      },
      errors: {
        fillAll: 'Remplissez tous les champs.', incorrect: 'Email ou mot de passe incorrect.', signinFailed: 'Connexion impossible.', registerFailed: 'Création du compte impossible.', accountExists: 'Un compte existe déjà avec cet email.',
        tooManyAttempts: 'Trop de tentatives d’inscription. Réessayez dans quelques minutes.', enterEmail: 'Saisissez votre email.', resetFailed: 'Envoi de l’email impossible.', passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.', passwordMismatch: 'Les mots de passe ne correspondent pas.', passwordUpdateFailed: 'Mise à jour du mot de passe impossible.',
        authCallbackFailed: 'Le lien d’authentification n’a pas pu être validé.', githubFailed: 'Échec de la connexion via GitHub', otpFailed: 'Envoi du code impossible.', missingCode: 'Saisissez le code reçu.', invalidCode: 'Ce code est invalide ou expiré.', otpVerifyFailed: 'Vérification du code impossible.',
      },
      success: { signedIn: 'Connexion réussie.', accountCreated: 'Compte créé.', passwordUpdated: 'Mot de passe mis à jour.', resetSent: 'Consultez votre email.', otpSent: 'Code envoyé.', otpVerified: 'Connexion réussie.' },
    },
  },
} as const

export type Language = keyof typeof translations
export type Translations = typeof translations.en
