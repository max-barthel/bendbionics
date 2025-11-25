import { authAPI } from '@/api/auth';
import { Button } from '@/components/ui';
import Typography from '@/components/ui/Typography';
import { useAuth } from '@/providers/AuthProvider';
import { modalVariants } from '@/styles/design-tokens';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface VerificationState {
  status: 'verifying' | 'success' | 'error' | 'expired' | 'already_verified';
  message: string;
}

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [verificationState, setVerificationState] = useState<VerificationState>(() => {
    // Check if we have a persisted verification state
    const token = searchParams.get('token');
    if (token) {
      const persistedState = localStorage.getItem(`verification_${token}`);
      if (persistedState) {
        try {
          return JSON.parse(persistedState);
        } catch {
          // If parsing fails, fall back to default state
        }
      }
    }
    return {
      status: 'verifying',
      message: 'Verifying your email...',
    };
  });
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent duplicate verification calls using useRef
      if (verificationAttempted.current) {
        return;
      }

      const token = searchParams.get('token');

      if (!token) {
        setVerificationState({
          status: 'error',
          message: 'No verification token provided.',
        });
        return;
      }

      // Skip verification if we already have a persisted state (success or error)
      const persistedState = localStorage.getItem(`verification_${token}`);
      if (
        persistedState &&
        (verificationState.status === 'success' ||
          verificationState.status === 'already_verified' ||
          verificationState.status === 'error' ||
          verificationState.status === 'expired')
      ) {
        return;
      }

      verificationAttempted.current = true;

      try {
        await authAPI.verifyEmail(token);
        const successState = {
          status: 'success' as const,
          message: 'Your email has been successfully verified!',
        };
        setVerificationState(successState);
        // Persist the success state
        localStorage.setItem(`verification_${token}`, JSON.stringify(successState));
        // Refresh user data to update email verification status
        await refreshUser();
      } catch (error: unknown) {
        console.error('Email verification failed:', error);

        // Check for specific error types
        let errorState: VerificationState;
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            errorState = {
              status: 'expired',
              message: 'This verification link has expired. Please request a new one.',
            };
          } else if (error.message.includes('Invalid verification token')) {
            errorState = {
              status: 'already_verified',
              message: 'This email has already been verified. You can now sign in.',
            };
          } else {
            errorState = {
              status: 'error',
              message: 'Email verification failed. The link may be invalid or expired.',
            };
          }
        } else {
          errorState = {
            status: 'error',
            message: 'Email verification failed. Please try again.',
          };
        }

        setVerificationState(errorState);
        // Persist the error state
        localStorage.setItem(`verification_${token}`, JSON.stringify(errorState));
      }
    };

    void verifyEmail();
  }, [searchParams, refreshUser, verificationState.status]);

  const handleContinue = () => {
    navigate('/auth');
  };

  const handleResendVerification = () => {
    navigate('/auth?action=resend-verification');
  };

  const getStatusIcon = () => {
    switch (verificationState.status) {
      case 'verifying':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        );
      case 'success':
      case 'already_verified':
        return (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case 'error':
      case 'expired':
        return (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (verificationState.status) {
      case 'success':
      case 'already_verified':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" data-testid="email-verification-page">
      <div className="w-full max-w-md mx-auto">
        <div className={`${modalVariants.contentGlass} p-8 text-center`}>
          {getStatusIcon()}

          <Typography variant="h2" className={`mb-4 ${getStatusColor()}`}>
            {verificationState.status === 'verifying' && 'Verifying Email'}
            {verificationState.status === 'success' && 'Email Verified!'}
            {verificationState.status === 'already_verified' && 'Already Verified!'}
            {verificationState.status === 'error' && 'Verification Failed'}
            {verificationState.status === 'expired' && 'Link Expired'}
          </Typography>

          <Typography variant="body" className="text-gray-600 mb-6">
            {verificationState.message}
          </Typography>

          <div className="space-y-3">
            {(verificationState.status === 'success' ||
              verificationState.status === 'already_verified') && (
              <Button
                variant="primary"
                onClick={handleContinue}
                className="mx-auto px-8 py-2"
              >
                Continue to Sign In
              </Button>
            )}

            {(verificationState.status === 'error' ||
              verificationState.status === 'expired') && (
              <>
                <Button
                  variant="primary"
                  onClick={handleResendVerification}
                  className="w-full"
                >
                  Request New Verification Email
                </Button>

                <Button onClick={handleContinue} size="lg" className="w-full">
                  Back to Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
