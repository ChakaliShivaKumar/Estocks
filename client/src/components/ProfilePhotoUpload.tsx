import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X, Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfilePhotoUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onRemove: () => void;
}

export function ProfilePhotoUpload({ currentImage, onImageChange, onRemove }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
      onImageChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    try {
      // In a real app, you would upload to a cloud service like AWS S3, Cloudinary, etc.
      // For now, we'll use the data URL directly
      const response = await fetch(`/api/users/${user?.id}/profile/picture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ imageUrl: previewUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      // Clear preview and reset file input
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={displayImage} alt="Profile" />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase() || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          {displayImage && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-lg">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">
            Upload a photo to personalize your profile
          </p>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            Choose Photo
          </Button>

          {previewUrl && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center max-w-xs">
          Supported formats: JPG, PNG, GIF. Max size: 5MB
        </div>
      </div>
    </Card>
  );
}
