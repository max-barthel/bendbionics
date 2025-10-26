import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { ExclamationTriangleIcon, TrashIcon, UserIcon } from '../icons';
import { Button, Typography } from '../ui';
import { EditProfile } from './EditProfile';

// Delete confirmation component
interface DeleteConfirmationProps {
  isDeleting: boolean;
  deleteError: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isDeleting,
  deleteError,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-2xl max-w-md w-full relative">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
          <Typography variant="h3" className="text-red-600">
            Delete Account
          </Typography>
        </div>
        <Typography variant="body" className="text-gray-600 mb-6">
          Are you sure you want to delete your account? This action cannot be undone.
          All your data will be permanently removed.
        </Typography>
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
            <Typography variant="body" className="text-red-600 text-sm">
              {deleteError}
            </Typography>
          </div>
        )}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 border border-gray-300 bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:scale-105 transition-all duration-300 rounded-full py-3"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 border border-red-300 bg-red-50/80 backdrop-blur-sm hover:bg-red-100/90 text-red-600 hover:text-red-700 hover:scale-105 transition-all duration-300 rounded-full py-3"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  </div>
);

interface ProfileProps {
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { user, logout, deleteAccount, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Refresh user data when Profile component opens to ensure latest info
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSuccessMessage('');
  };

  const handleEditSuccess = (message: string) => {
    setSuccessMessage(message);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 z-10"
          aria-label="Close profile settings"
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
              {isEditing ? 'Edit Profile' : 'Profile'}
            </Typography>
            <Typography variant="body" color="gray" className="text-gray-600">
              {isEditing ? 'Update your account information' : 'Manage your account'}
            </Typography>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <Typography variant="body" className="text-green-600 text-sm">
                {successMessage}
              </Typography>
            </div>
          )}

          {isEditing ? (
            <EditProfile onCancel={handleCancelEdit} onSuccess={handleEditSuccess} />
          ) : (
            <>
              {/* User Info Display */}
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
                      Email:
                    </Typography>
                    <Typography variant="body" color="primary" className="font-medium">
                      {user?.email}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body" color="gray" className="text-sm">
                      Email Verified:
                    </Typography>
                    <Typography
                      variant="body"
                      className={`font-medium ${user?.email_verified ? 'text-green-600' : 'text-orange-600'}`}
                    >
                      {user?.email_verified ? '✓ Verified' : '⚠ Not Verified'}
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full border border-gray-300 bg-white hover:scale-105 transition-all duration-300 rounded-full py-3"
                >
                  Edit Profile
                </Button>

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
            </>
          )}
        </div>
      </div>

      {showDeleteConfirmation && (
        <DeleteConfirmation
          isDeleting={isDeleting}
          deleteError={deleteError}
          onConfirm={handleDeleteAccount}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};
