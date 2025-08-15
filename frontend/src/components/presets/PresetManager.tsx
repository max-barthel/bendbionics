import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreatePresetRequest, Preset } from "../../api/auth";
import { presetAPI } from "../../api/auth";
import { useAuth } from "../../providers";
import { Badge, Button, Card, Input, Typography } from "../ui";

interface PresetManagerProps {
  currentConfiguration: Record<string, any>;
  onLoadPreset: (configuration: Record<string, any>) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentConfiguration,
  onLoadPreset,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadPresets();
    }
  }, [user]);

  const loadPresets = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userPresets = await presetAPI.getUserPresets();
      setPresets(userPresets);
    } catch (error) {
      console.error("Failed to load presets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!presetName.trim()) {
      setError("Preset name is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const newPreset: CreatePresetRequest = {
        name: presetName.trim(),
        description: presetDescription.trim() || undefined,
        is_public: isPublic,
        configuration: currentConfiguration,
      };

      await presetAPI.createPreset(newPreset);
      setPresetName("");
      setPresetDescription("");
      setIsPublic(false);
      setShowSaveForm(false);
      await loadPresets(); // Reload presets
    } catch (error: any) {
      setError(error.response?.data?.detail || "Failed to save preset");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    try {
      onLoadPreset(preset.configuration);
    } catch (error) {
      console.error("Failed to load preset:", error);
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!confirm("Are you sure you want to delete this preset?")) {
      return;
    }

    try {
      await presetAPI.deletePreset(presetId);
      await loadPresets(); // Reload presets
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <Typography variant="h3" color="primary">
            Preset Manager
          </Typography>
          <Typography variant="body" color="gray">
            Sign in to save and load your robot configurations
          </Typography>
          <div className="space-y-2">
            <Button
              variant="primary"
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Sign In to Save Presets
            </Button>
            <Typography variant="body" color="gray" className="text-sm">
              You can still use the app without signing in!
            </Typography>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h3" color="primary">
          Preset Manager
        </Typography>
        <Button
          variant="secondary"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          {showSaveForm ? "Cancel" : "Save Current"}
        </Button>
      </div>

      {showSaveForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <Typography variant="h4" color="primary">
            Save Current Configuration
          </Typography>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preset Name *
              </label>
              <Input
                type="text"
                value={presetName}
                onChange={(value) => setPresetName(String(value))}
                placeholder="Enter preset name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <Input
                type="text"
                value={presetDescription}
                onChange={(value) => setPresetDescription(String(value))}
                placeholder="Enter description"
                className="w-full"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                Make this preset public
              </label>
            </div>
            {error && (
              <Typography variant="body" color="error" className="text-sm">
                {error}
              </Typography>
            )}
            <Button
              variant="primary"
              onClick={handleSavePreset}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Saving..." : "Save Preset"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Typography variant="h4" color="primary">
          Your Presets
        </Typography>
        {isLoading ? (
          <div className="text-center py-8">
            <Typography variant="body" color="gray">
              Loading presets...
            </Typography>
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body" color="gray">
              No presets saved yet. Create your first preset above!
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Typography variant="h5" color="primary">
                        {preset.name}
                      </Typography>
                      {preset.is_public && (
                        <Badge variant="secondary" size="sm">
                          Public
                        </Badge>
                      )}
                    </div>
                    {preset.description && (
                      <Typography variant="body" color="gray" className="mb-2">
                        {preset.description}
                      </Typography>
                    )}
                    <Typography variant="body" color="gray" className="text-sm">
                      Created:{" "}
                      {new Date(preset.created_at).toLocaleDateString()}
                    </Typography>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
