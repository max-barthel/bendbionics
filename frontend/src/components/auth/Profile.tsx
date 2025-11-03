import { ExclamationTriangleIcon, TrashIcon, UserIcon } from '@/components/icons';
import { Button, FormMessage, Modal, Typography } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { buttonVariants, modalVariants } from '@/styles/design-tokens';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditProfile } from './EditProfile';

// Delete confirmation component
interface DeleteConfirmationProps {
  readonly isDeleting: boolean;
  readonly deleteError: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isDeleting,
  deleteError,
  onConfirm,
  onCancel,
}) => (
  <Modal
    isOpen={true}
    onClose={onCancel}
    size="sm"
    contentClassName={modalVariants.contentGlassStrong}
  >
    <div className="flex items-center mb-4">
      <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
      <Typography variant="h3" className="text-red-600">
        Delete Account
      </Typography>
    </div>
    <Typography variant="body" className="text-gray-600 mb-6">
      Are you sure you want to delete your account? This action cannot be undone. All
      your data will be permanently removed.
    </Typography>
    {deleteError && <FormMessage message={deleteError} type="error" variant="glass" />}
    <div className="flex space-x-3">
      <Button
        onClick={onCancel}
        disabled={isDeleting}
        className={`flex-1 ${buttonVariants.outline} py-3`}
      >
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={isDeleting}
        className={`flex-1 ${buttonVariants.delete} py-3`}
      >
        {isDeleting ? 'Deleting...' : 'Delete Account'}
      </Button>
    </div>
  </Modal>
);

interface ProfileProps {
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { user, deleteAccount, refreshUser } = useAuth();
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
    <>
      <Modal isOpen={true} onClose={onClose} size="sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
            <UserIcon className="w-8 h-8 text-gray-600" />
          </div>
          <div className="flex flex-col">
            <Typography variant="h3" color="primary" className="text-gray-800">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </Typography>
            <Typography variant="body" color="gray" className="text-gray-600">
              {isEditing ? 'Update your account information' : 'Manage your account'}
            </Typography>
          </div>
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

            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className={buttonVariants.edit}
                >
                  Edit Profile
                </Button>

                <Button
                  size="sm"
                  onClick={confirmDelete}
                  className={buttonVariants.delete}
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrashIcon className="w-4 h-4" />
                    Delete Account
                  </div>
                </Button>
              </div>

              <Button
                size="sm"
                onClick={onClose}
                className={buttonVariants.outline}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>

      {showDeleteConfirmation && (
        <DeleteConfirmation
          isDeleting={isDeleting}
          deleteError={deleteError}
          onConfirm={handleDeleteAccount}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
};
