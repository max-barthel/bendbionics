import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api/auth';
import Button from '../ui/Button';
import Typography from '../ui/Typography';

interface VerificationState {
  status: 'verifying' | 'success' | 'error' | 'expired';
  message: string;
}

export const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your email...',
  });

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setVerificationState({
          status: 'error',
          message: 'No verification token provided.',
        });
        return;
      }

      try {
        await authAPI.verifyEmail(token);
        setVerificationState({
          status: 'success',
          message: 'Your email has been successfully verified!',
        });
      } catch (error: unknown) {
        console.error('Email verification failed:', error);

        // Check if it's an expired token error
        if (error instanceof Error && error.message.includes('expired')) {
          setVerificationState({
            status: 'expired',
            message: 'This verification link has expired. Please request a new one.',
          });
        } else {
          setVerificationState({
            status: 'error',
            message: 'Email verification failed. The link may be invalid or expired.',
          });
        }
      }
    };

    void verifyEmail();
  }, [searchParams]);

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
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 text-center">
          {getStatusIcon()}

          <Typography variant="h2" className={`mb-4 ${getStatusColor()}`}>
            {verificationState.status === 'verifying' && 'Verifying Email'}
            {verificationState.status === 'success' && 'Email Verified!'}
            {verificationState.status === 'error' && 'Verification Failed'}
            {verificationState.status === 'expired' && 'Link Expired'}
          </Typography>

          <Typography variant="body" className="text-gray-600 mb-6">
            {verificationState.message}
          </Typography>

          <div className="space-y-3">
            {verificationState.status === 'success' && (
              <Button
                onClick={handleContinue}
                variant="primary"
                size="lg"
                className="w-full backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
              >
                Continue to Sign In
              </Button>
            )}

            {(verificationState.status === 'error' ||
              verificationState.status === 'expired') && (
              <>
                <Button
                  onClick={handleResendVerification}
                  variant="primary"
                  size="lg"
                  className="w-full backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
                >
                  Request New Verification Email
                </Button>

                <Button
                  onClick={handleContinue}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
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
