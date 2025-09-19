import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { ExclamationTriangleIcon, TrashIcon, UserIcon } from '../icons';
import { Button, Typography } from '../ui';

interface UserSettingsProps {
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();
      navigate('/');
      onClose();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete account'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirmation(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 z-10"
          aria-label="Close user settings"
        >
          <svg
            className="w-4 h-4 text-gray-600 transition-transform duration-300"
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
        </button>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <UserIcon className="w-8 h-8 text-gray-600" />
            </div>
            <Typography variant="h3" color="primary" className="mb-2 text-gray-800">
              Account Settings
            </Typography>
            <Typography variant="body" color="gray" className="text-gray-600">
              Manage your account preferences
            </Typography>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Typography variant="body" color="gray" className="text-sm">
                  Username:
                </Typography>
                <Typography variant="body" color="primary" className="font-medium">
                  {user?.username}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="body" color="gray" className="text-sm">
                  Account Type:
                </Typography>
                <Typography variant="body" color="primary" className="font-medium">
                  Local
                </Typography>
              </div>
            </div>
          </div>

          {!showDeleteConfirmation ? (
            /* Normal Settings View */
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border border-gray-300 bg-white hover:scale-105 transition-all duration-300 rounded-full py-3"
              >
                Sign Out
              </Button>

              <Button
                variant="outline"
                onClick={confirmDelete}
                className="w-full border border-red-300 bg-red-50 hover:scale-105 text-red-600 hover:text-red-700 transition-all duration-300 rounded-full py-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <TrashIcon className="w-4 h-4" />
                  Delete Account
                </div>
              </Button>
            </div>
          ) : (
            /* Delete Confirmation View */
            <div className="space-y-4">
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <Typography variant="h4" color="primary" className="text-red-700">
                    Delete Account
                  </Typography>
                </div>
                <Typography
                  variant="body"
                  color="gray"
                  className="text-sm leading-relaxed text-gray-600"
                >
                  This action cannot be undone. This will permanently delete your
                  account and remove all your presets and data from our servers.
                </Typography>
              </div>

              {deleteError && (
                <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                  <Typography
                    variant="body"
                    color="primary"
                    className="text-red-600 text-sm"
                  >
                    {deleteError}
                  </Typography>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 border border-red-300 bg-red-100 hover:scale-105 text-red-600 hover:text-red-700 transition-all duration-300 rounded-full py-3 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </Button>

                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 border border-gray-300 bg-gray-50 hover:scale-105 transition-all duration-300 rounded-full py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
