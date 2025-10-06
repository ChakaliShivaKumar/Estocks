import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Edit3, User, Mail, Phone, MapPin, Calendar, Check, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  coinsBalance: number;
  profilePicture?: string;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileEditFormProps {
  onSave?: () => void;
}

export function ProfileEditForm({ onSave }: ProfileEditFormProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    phoneNumber: "",
    dateOfBirth: "",
    location: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Check if form has changes
    if (profile) {
      const hasFormChanges = 
        formData.fullName !== (profile.fullName || "") ||
        formData.bio !== (profile.bio || "") ||
        formData.phoneNumber !== (profile.phoneNumber || "") ||
        formData.dateOfBirth !== (profile.dateOfBirth || "") ||
        formData.location !== (profile.location || "");
      setHasChanges(hasFormChanges);
    }
  }, [formData, profile]);

  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          errors.fullName = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.fullName = 'Full name must be at least 2 characters';
        } else {
          delete errors.fullName;
        }
        break;
      case 'bio':
        if (value.length > 500) {
          errors.bio = 'Bio must be less than 500 characters';
        } else {
          delete errors.bio;
        }
        break;
      case 'phoneNumber':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.phoneNumber = 'Please enter a valid phone number';
        } else {
          delete errors.phoneNumber;
        }
        break;
      case 'dateOfBirth':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 13 || age > 120) {
            errors.dateOfBirth = 'Please enter a valid birth date';
          } else {
            delete errors.dateOfBirth;
          }
        } else {
          delete errors.dateOfBirth;
        }
        break;
      case 'location':
        if (value.length > 100) {
          errors.location = 'Location must be less than 100 characters';
        } else {
          delete errors.location;
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/profile`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        bio: data.bio || "",
        phoneNumber: data.phoneNumber || "",
        dateOfBirth: data.dateOfBirth || "",
        location: data.location || ""
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear success message when user starts typing
    if (success) setSuccess(null);
    
    // Validate field in real-time
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate all fields before saving
    const allFieldsValid = ['fullName', 'bio', 'phoneNumber', 'dateOfBirth', 'location']
      .every(field => validateField(field, formData[field as keyof typeof formData]));

    if (!allFieldsValid) {
      setError('Please fix all validation errors before saving');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        phoneNumber: profile.phoneNumber || "",
        dateOfBirth: profile.dateOfBirth || "",
        location: profile.location || ""
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setHasChanges(false);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading profile...
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Failed to load profile
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6" />
          <h2 className="text-xl font-bold">Profile Information</h2>
          {hasChanges && isEditing && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !hasChanges || Object.keys(validationErrors).length > 0}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>
            <Input value={profile.username} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input value={profile.email} disabled className="bg-muted" />
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your full name"
              className={validationErrors.fullName ? "border-red-500" : ""}
            />
            {validationErrors.fullName && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.fullName}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your phone number"
              className={validationErrors.phoneNumber ? "border-red-500" : ""}
            />
            {validationErrors.phoneNumber && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.phoneNumber}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              disabled={!isEditing}
              className={validationErrors.dateOfBirth ? "border-red-500" : ""}
            />
            {validationErrors.dateOfBirth && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.dateOfBirth}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your location"
              className={validationErrors.location ? "border-red-500" : ""}
            />
            {validationErrors.location && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.location}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
            rows={4}
            className={`resize-none ${validationErrors.bio ? "border-red-500" : ""}`}
          />
          <div className="flex justify-between items-center">
            <div className={`text-sm ${formData.bio.length > 450 ? "text-orange-500" : "text-muted-foreground"}`}>
              {formData.bio.length}/500 characters
            </div>
            {validationErrors.bio && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationErrors.bio}
              </div>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Member since</Label>
              <div className="font-medium">
                {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Last updated</Label>
              <div className="font-medium">
                {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Account status</Label>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
