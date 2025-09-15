import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { ExclamationTriangleIcon, TrashIcon, UserIcon } from "../icons";
import { Button, Typography } from "../ui";

interface UserSettingsProps {
  onClose: () => void;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onClose }) => {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAccount();
      navigate("/");
      onClose();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete account"
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
    setDeleteError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-black/10">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <UserIcon className="w-8 h-8 text-gray-700" />
            </div>
            <Typography variant="h3" color="primary" className="mb-2">
              Account Settings
            </Typography>
            <Typography variant="body" color="gray" className="text-sm">
              Manage your account preferences
            </Typography>
          </div>

          {/* User Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/20">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Typography variant="body" color="gray" className="text-sm">
                  Username:
                </Typography>
                <Typography
                  variant="body"
                  color="primary"
                  className="font-medium"
                >
                  {user?.username}
                </Typography>
              </div>
              {user?.email && (
                <div className="flex justify-between">
                  <Typography variant="body" color="gray" className="text-sm">
                    Email:
                  </Typography>
                  <Typography
                    variant="body"
                    color="primary"
                    className="font-medium"
                  >
                    {user.email}
                  </Typography>
                </div>
              )}
              <div className="flex justify-between">
                <Typography variant="body" color="gray" className="text-sm">
                  Account Type:
                </Typography>
                <Typography
                  variant="body"
                  color="primary"
                  className="font-medium"
                >
                  {user?.is_local ? "Local" : "Email Verified"}
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
                className="w-full border border-gray-300/50 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 rounded-2xl py-3"
              >
                Sign Out
              </Button>

              <Button
                variant="outline"
                onClick={confirmDelete}
                className="w-full border border-red-300/50 bg-red-500/10 backdrop-blur-sm hover:bg-red-500/20 text-red-600 hover:text-red-700 transition-all duration-300 rounded-2xl py-3"
              >
                <div className="flex items-center justify-center gap-2">
                  <TrashIcon className="w-4 h-4" />
                  Delete Account
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={onClose}
                className="w-full border border-gray-300/50 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 rounded-2xl py-3"
              >
                Cancel
              </Button>
            </div>
          ) : (
            /* Delete Confirmation View */
            <div className="space-y-4">
              <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-300/30">
                <div className="flex items-center gap-3 mb-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  <Typography
                    variant="h4"
                    color="primary"
                    className="text-red-700"
                  >
                    Delete Account
                  </Typography>
                </div>
                <Typography
                  variant="body"
                  color="gray"
                  className="text-sm leading-relaxed"
                >
                  This action cannot be undone. This will permanently delete
                  your account and remove all your presets and data from our
                  servers.
                </Typography>
              </div>

              {deleteError && (
                <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-3 border border-red-300/30">
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
                  className="flex-1 border border-red-300/50 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-600 hover:text-red-700 transition-all duration-300 rounded-2xl py-3 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </Button>

                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 border border-gray-300/50 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 rounded-2xl py-3"
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
