import { Button, Input, Typography } from '@/components/ui';
import {
  useAsyncOperation,
  useFormFields,
  useUnifiedErrorHandler,
} from '@/features/shared';
import { useAuth } from '@/providers/AuthProvider';
import { buttonVariants } from '@/styles/design-tokens';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidation';

interface EditProfileProps {
  onCancel: () => void;
  onSuccess: (message: string) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ onCancel, onSuccess }) => {
  const { user, updateProfile } = useAuth();

  // Manage form fields with useFormFields hook
  const fields = useFormFields([
    { name: 'username', initialValue: user?.username || '' },
    { name: 'email', initialValue: user?.email || '' },
    { name: 'currentPassword', initialValue: '' },
    { name: 'newPassword', initialValue: '' },
    { name: 'confirmPassword', initialValue: '' },
  ]);

  const usernameField = fields.getFieldByName('username')!;
  const emailField = fields.getFieldByName('email')!;
  const currentPasswordField = fields.getFieldByName('currentPassword')!;
  const newPasswordField = fields.getFieldByName('newPassword')!;
  const confirmPasswordField = fields.getFieldByName('confirmPassword')!;

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
      if (emailField.value !== user?.email) {
        message =
          'Profile updated! Please check the server logs for your verification link.';
      }
      onSuccess(message);
    },
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const values = fields.getValues();

    // Extract values with defaults to avoid undefined issues
    const newPassword = values['newPassword'] ?? '';
    const confirmPassword = values['confirmPassword'] ?? '';
    const currentPassword = values['currentPassword'] ?? '';
    const username = values['username'] ?? '';
    const email = values['email'] ?? '';

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
          value={usernameField.value}
          onChange={usernameField.setValue}
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
          value={emailField.value}
          onChange={emailField.setValue}
          placeholder="Enter email"
          className="w-full"
        />
        {emailField.value !== user?.email && (
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
              value={newPasswordField.value}
              onChange={newPasswordField.setValue}
              placeholder="Enter new password"
              className="w-full"
            />
          </div>

          {newPasswordField.value && (
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
                value={confirmPasswordField.value}
                onChange={confirmPasswordField.setValue}
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
            value={currentPasswordField.value}
            onChange={currentPasswordField.setValue}
            placeholder="Enter current password to confirm"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">Required to save any changes</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4 justify-between">
        <Button
          type="submit"
          size="sm"
          disabled={isUpdating}
          className={buttonVariants.load}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onCancel}
          disabled={isUpdating}
          className={buttonVariants.delete}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
