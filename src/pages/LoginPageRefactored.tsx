import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { isValidEmail, formatDate } from '@/lib/utils';
import { MESSAGES } from '@/constants';

/**
 * Enhanced Login Page
 * Two-step authentication: email/password + security questions
 */
const LoginPageRefactored = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  // State Management
  const [step, setStep] = useState<'email' | 'security'>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: '',
    answer2: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityQuestions, setSecurityQuestions] = useState({
    q1: '',
    q2: '',
  });
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30; // minutes

  // Input change handlers
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  }, []);

  const handleSecurityAnswerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSecurityAnswers((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  }, []);

  // Prevent timing attacks with random delay
  const getRandomDelay = () => 50 + Math.random() * 150;

  // Step 1: Email and Password Verification
  const handleStep1Submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Honeypot check
      if (honeypot) {
        console.warn('Honeypot triggered');
        return;
      }

      // Lockout check
      if (lockoutUntil && lockoutUntil > new Date()) {
        setError(`الحساب مقفول. حاول بعد ${formatDate(lockoutUntil, 'HH:mm')}`);
        return;
      }

      // Validation
      if (!formData.email || !formData.password) {
        setError(MESSAGES.VALIDATION.REQUIRED);
        return;
      }

      if (!isValidEmail(formData.email)) {
        setError(MESSAGES.ERROR.INVALID_EMAIL);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Prevent timing attacks
        await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));

        // Attempt to sign in
        await signIn(formData.email, formData.password);

        // If successful, proceed to security verification
        // TODO: Fetch security questions from user profile
        setSecurityQuestions({
          q1: 'ما هو اسم حيوانك الأليف المفضل؟',
          q2: 'ما هي مدينة ولادتك؟',
        });
        setStep('security');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : MESSAGES.ERROR.NETWORK;

        // Track failed attempts
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);

        // Lock account after max attempts
        if (newAttemptCount >= MAX_ATTEMPTS) {
          const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000);
          setLockoutUntil(lockoutTime);
          setError(
            `تم قفل الحساب لمدة ${LOCKOUT_DURATION} دقيقة. حاول لاحقاً.`
          );
        } else {
          const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
          setError(
            `بيانات الدخول غير صحيحة. ${remainingAttempts} محاولات متبقية.`
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, honeypot, lockoutUntil, attemptCount, signIn]
  );

  // Step 2: Security Questions Verification
  const handleStep2Submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (honeypot) {
        console.warn('Honeypot triggered');
        return;
      }

      // Validation
      if (!securityAnswers.answer1 || !securityAnswers.answer2) {
        setError(MESSAGES.VALIDATION.REQUIRED);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, getRandomDelay()));

        // TODO: Verify security answers via backend
        // For now, assume verification passes
        const answersCorrect = true; // Replace with actual verification

        if (answersCorrect) {
          // Reset attempts on success
          setAttemptCount(0);
          setLockoutUntil(null);

          // Navigate to dashboard
          navigate('/dashboard');
        } else {
          setError('الإجابات غير صحيحة');
        }
      } catch (err) {
        setError(MESSAGES.ERROR.NETWORK);
      } finally {
        setIsLoading(false);
      }
    },
    [securityAnswers, honeypot, navigate]
  );

  // Handle back to email step
  const handleBackToEmail = useCallback(() => {
    setStep('email');
    setSecurityAnswers({ answer1: '', answer2: '' });
    setError(null);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك</h1>
          <p className="text-slate-400">
            {step === 'email' ? 'قم بتسجيل الدخول لحسابك' : 'تحقق من هويتك'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content with Animation */}
          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form
                key="email-form"
                onSubmit={handleStep1Submit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Honeypot field */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px] opacity-0"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Email Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300" htmlFor="email">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleEmailChange}
                      disabled={isLoading}
                      autoComplete="email"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pl-10 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300" htmlFor="password">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleEmailChange}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pl-10 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="security-form"
                onSubmit={handleStep2Submit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Security Question 1 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">
                    {securityQuestions.q1}
                  </Label>
                  <Input
                    name="answer1"
                    type="text"
                    placeholder="أدخل الإجابة"
                    value={securityAnswers.answer1}
                    onChange={handleSecurityAnswerChange}
                    disabled={isLoading}
                    autoComplete="off"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Security Question 2 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">
                    {securityQuestions.q2}
                  </Label>
                  <Input
                    name="answer2"
                    type="text"
                    placeholder="أدخل الإجابة"
                    value={securityAnswers.answer2}
                    onChange={handleSecurityAnswerChange}
                    disabled={isLoading}
                    autoComplete="off"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToEmail}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    العودة
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        التحقق...
                      </>
                    ) : (
                      'تأكيد'
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          معلومات الدخول محمية بتشفير قوي
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPageRefactored;
