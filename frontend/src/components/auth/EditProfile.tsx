import { Button, Input, Typography } from '@/components/ui';
import { useAsyncOperation, useUnifiedErrorHandler } from '@/features/shared';
import { useAuth } from '@/providers/AuthProvider';
import { buttonVariants } from '@/styles/design-tokens';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidation';
import { useState } from 'react';

interface EditProfileProps {
  onCancel: () => void;
  onSuccess: (message: string) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onCancel, onSuccess }) => {
  const { user, updateProfile } = useAuth();

  // Edit form state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Use unified error handler for validation errors (shown before async operation)
  const { showError } = useUnifiedErrorHandler();

  // Use async operation hook for the actual profile update
  const {
    isLoading: isUpdating,
    error,
    execute,
  } = useAsyncOperation({
    onSuccess: () => {
      // If email was changed, show verification message
      let message = 'Profile updated successfully!';
      if (email !== user?.email) {
        message =
          'Profile updated! Please check the server logs for your verification link.';
      }
      onSuccess(message);
    },
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password confirmation if changing password
    if (newPassword) {
      const matchValidation = validatePasswordMatch(
        newPassword,
        confirmPassword,
        'New passwords'
      );
      if (!matchValidation.isValid && matchValidation.error) {
        showError('validation', matchValidation.error);
        return;
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword, 'New password');
      if (!passwordValidation.isValid && passwordValidation.error) {
        showError('validation', passwordValidation.error);
        return;
      }
    }

    // Check if anything has changed
    const hasChanges =
      username !== user?.username || email !== user?.email || newPassword.length > 0;

    if (!hasChanges) {
      showError('validation', 'No changes to save');
      return;
    }

    // Require current password for any changes
    if (!currentPassword) {
      showError('validation', 'Current password is required to update profile');
      return;
    }

    await execute(async () => {
      const updateData: {
        username?: string;
        email?: string;
        current_password: string;
        new_password?: string;
      } = {
        current_password: currentPassword,
      };

      if (username !== user?.username) {
        updateData.username = username;
      }
      if (email !== user?.email) {
        updateData.email = email;
      }
      if (newPassword) {
        updateData.new_password = newPassword;
      }

      await updateProfile(updateData);
    });
  };

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-4">
      {/* Error Message */}
      {error.visible && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <Typography variant="body" className="text-red-600 text-sm">
            {error.message}
          </Typography>
        </div>
      )}

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(value: string | number) => setUsername(String(value))}
          placeholder="Enter username"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(value: string | number) => setEmail(String(value))}
          placeholder="Enter email"
          className="w-full"
        />
        {email !== user?.email && (
          <p className="text-xs text-orange-600 mt-1">
            Changing email will require re-verification
          </p>
        )}
      </div>

      <div className="border-t pt-4">
        <Typography variant="body" className="text-sm text-gray-600 mb-3">
          Leave password fields empty if you don't want to change it
        </Typography>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password (optional)
            </label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(value: string | number) => setNewPassword(String(value))}
              placeholder="Enter new password"
              className="w-full"
            />
          </div>

          {newPassword && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(value: string | number) => setConfirmPassword(String(value))}
                placeholder="Confirm new password"
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current Password *
          </label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(value: string | number) => setCurrentPassword(String(value))}
            placeholder="Enter current password to confirm"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Required to save any changes</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          size="sm"
          onClick={onCancel}
          disabled={isUpdating}
          className={buttonVariants.delete}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isUpdating}
          className={buttonVariants.load}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};
