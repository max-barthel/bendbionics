import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../providers";
import { Button, Card, LoadingSpinner, Typography } from "../ui";

export const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    const handleVerification = async () => {
      if (!token) {
        setVerificationStatus({
          success: false,
          message:
            "No verification token found. Please check your email for the correct link.",
        });
        return;
      }

      setIsVerifying(true);
      try {
        await verifyEmail(token);
        setVerificationStatus({
          success: true,
          message:
            "Email verified successfully! You can now sign in to your account.",
        });
      } catch (error: any) {
        setVerificationStatus({
          success: false,
          message:
            error.response?.data?.detail ||
            "Verification failed. Please try again or contact support.",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    handleVerification();
  }, [token, verifyEmail]);

  const handleContinue = () => {
    navigate("/auth");
  };

  const handleBackToApp = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <Typography variant="h2" color="primary" className="mb-2">
            Email Verification
          </Typography>
          <Typography variant="body" color="gray">
            Verifying your email address
          </Typography>
        </div>

        {isVerifying && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" color="primary" className="mb-4" />
            <Typography variant="body" color="gray">
              Verifying your email...
            </Typography>
          </div>
        )}

        {verificationStatus && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-md ${
                verificationStatus.success
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <Typography variant="body" className="font-medium">
                {verificationStatus.message}
              </Typography>
            </div>

            <div className="flex flex-col space-y-2">
              {verificationStatus.success ? (
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Continue to Sign In
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Try Again
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleBackToApp}
                className="w-full"
              >
                Back to App
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
