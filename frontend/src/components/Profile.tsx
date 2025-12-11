import { useState, useEffect } from 'react';
import {
  Camera,
  Edit2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Users,
  Heart,
  Settings,
  LogOut,
  Check,
  X,
  Upload,
  FileText
} from 'lucide-react';

// STUB COMPONENTS (To ensure dependencies resolve without external files)
const ImageWithFallback = ({ src, alt, className }: any) => <img src={src || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='} alt={alt} className={className} />;
const ManageFriends = ({ onClose }: any) => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] text-white">Manage Friends Modal Stub <button onClick={onClose}>[X]</button></div>;
const SavedPlaces = ({ onClose }: any) => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] text-white">Saved Places Modal Stub <button onClick={onClose}>[X]</button></div>;
const MyPosts = ({ onClose }: any) => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[500] text-white">My Posts Modal Stub <button onClick={onClose}>[X]</button></div>;
// The local utility imports are commented out to prevent reference errors, and their logic is simulated.
// import { initializeProfileDatabase, getFriends, getSavedPlaces } from '../utils/profileDatabase';

interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  joinDate: string;
  avatar: string;
  stats: {
    posts: number;
    friends: number;
    trips: number;
  };
}

interface ProfileProps {
  onLogout?: () => void;
}

const initialProfile: UserProfile = {
  name: 'Nguyen Van An',
  username: '@vanan',
  email: 'vanan@friendus.vn',
  phone: '+84 123 456 789',
  bio: 'Travel enthusiast exploring Vietnam 🇻🇳 | Love discovering hidden gems',
  location: 'Ho Chi Minh City, Vietnam',
  joinDate: 'January 2024',
  avatar: '👤',
  stats: {
    posts: 42,
    friends: 156,
    trips: 23
  }
};

const avatarOptions = ['👤', '😊', '🙂', '😎', '🤗', '🥳', '🤩', '😇', '🧑', '👨', '👩', '🧔', '👱', '🧑‍💼', '👨‍💼'];

export function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(initialProfile);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showManageFriends, setShowManageFriends] = useState(false);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Fetch Profile Data on Load (Simulated API call)
  useEffect(() => {
    const fetchProfile = async () => {
      // In a real app: const response = await fetch('/api/profile');
      // For now, simulate loading delay and success/failure
      try {
        setFetchError(null);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        // Assume API returns data matching UserProfile structure (mapping name -> display_name, location -> location_label)
        const fetchedData: UserProfile = { ...initialProfile, name: 'Minh Nguyen', username: '@minhnguyen' };
        setProfile(fetchedData);
        setEditedProfile(fetchedData);

      } catch (error) {
        setFetchError("Failed to load profile data.");
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  // 2. Save Profile (Simulated API call)
  const handleSave = async () => {
    setIsSaving(true);
    setFetchError(null);
    
    // Data mapping to match backend model (e.g., name -> display_name)
    const payload = {
      display_name: editedProfile.name,
      username: editedProfile.username,
      email: editedProfile.email,
      phone: editedProfile.phone,
      bio: editedProfile.bio,
      location_label: editedProfile.location,
      avatar: editedProfile.avatar,
    };

    // In a real app: const response = await fetch('/api/profile', { method: 'PUT', body: JSON.stringify(payload), ... });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      // Assume success, update the main profile state
      setProfile(editedProfile);
      setIsEditing(false);
      alert('Profile saved successfully!');

    } catch (error) {
      setFetchError("Failed to save profile. Please try again.");
      console.error(error);
      setIsEditing(true); // Stay in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleAvatarChange = (newAvatar: string) => {
    setEditedProfile({ ...editedProfile, avatar: newAvatar });
    setShowAvatarPicker(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setEditedProfile({ ...editedProfile, avatar: imageUrl });
        setShowAvatarPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('avatar-upload')?.click();
  };
  
  if (fetchError) {
      return (
          <div className="max-w-4xl mx-auto p-8 text-center bg-red-100 dark:bg-red-900/50 rounded-lg m-4">
              <p className="text-red-800 dark:text-red-400 font-bold">Error Loading Profile:</p>
              <p className="text-red-700 dark:text-red-300">{fetchError}</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 transition-colors duration-300">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 transition-colors duration-300" />

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-6xl transition-colors duration-300 overflow-hidden">
              {(isEditing ? editedProfile.avatar : profile.avatar).startsWith('data:') ? (
                <ImageWithFallback // Using ImageWithFallback stub
                  src={isEditing ? editedProfile.avatar : profile.avatar} 
                  alt="Profile avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{isEditing ? editedProfile.avatar : profile.avatar}</span>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Avatar Picker */}
          {isEditing && showAvatarPicker && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 transition-colors duration-300">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Choose your avatar:</p>
              <div className="grid grid-cols-5 gap-3">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarChange(avatar)}
                    className="w-12 h-12 bg-white dark:bg-gray-600 rounded-full border-2 border-gray-200 dark:border-gray-500 hover:border-blue-600 dark:hover:border-blue-400 flex items-center justify-center text-2xl transition-all hover:scale-110"
                  >
                    {avatar}
                  </button>
                ))}
                <button
                  onClick={triggerFileInput}
                  className="w-12 h-12 bg-white dark:bg-gray-600 rounded-full border-2 border-gray-200 dark:border-gray-500 hover:border-blue-600 dark:hover:border-blue-400 flex items-center justify-center text-2xl transition-all hover:scale-110"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Name and Username */}
          {isEditing ? (
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Username</label>
                <input
                  type="text"
                  value={editedProfile.username}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  disabled={isSaving}
                />
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h2 className="text-2xl mb-1 dark:text-white">{profile.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{profile.username}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
              <p className="text-2xl text-blue-600 dark:text-blue-400">{profile.stats.posts}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
              <p className="text-2xl text-purple-600 dark:text-purple-400">{profile.stats.friends}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Friends</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
              <p className="text-2xl text-green-600 dark:text-green-400">{profile.stats.trips}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Places Visited</p>
            </div>
          </div>

          {/* Edit/Save Buttons */}
          {isEditing ? (
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><Check className="w-5 h-5" /> Save Changes</>}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 mb-6 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300">
        <h3 className="text-xl mb-4 dark:text-white">Profile Information</h3>

        <div className="space-y-4">
          {/* Bio */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">Bio</label>
            {isEditing ? (
              <textarea
                value={editedProfile.bio}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, bio: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                disabled={isSaving}
              />
            ) : (
              <p className="text-gray-800 dark:text-gray-200">{profile.bio}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="flex-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 transition-colors"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-800 dark:text-gray-200">{profile.email}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="flex-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 transition-colors"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-800 dark:text-gray-200">{profile.phone}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="flex-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mt-1 transition-colors"
                  disabled={isSaving}
                />
              ) : (
                <p className="text-gray-800 dark:text-gray-200">{profile.location}</p>
              )}
            </div>
          </div>

          {/* Join Date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Member Since</label>
              <p className="text-gray-800 dark:text-gray-200">{profile.joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-colors duration-300">
        <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="dark:text-white">Settings & Privacy</span>
        </button>
        <button
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          onClick={() => setShowManageFriends(true)}
        >
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="dark:text-white">Manage Friends</span>
        </button>
        <button
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          onClick={() => setShowSavedPlaces(true)}
        >
          <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="dark:text-white">Saved Places</span>
        </button>
        <button
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          onClick={() => setShowMyPosts(true)}
        >
          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="dark:text-white">My Posts</span>
        </button>
        <button
          className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Modals - Renders conditionally over the page */}
      {showManageFriends && ( <ManageFriends onClose={() => setShowManageFriends(false)} /> )}
      {showSavedPlaces && ( <SavedPlaces onClose={() => setShowSavedPlaces(false)} /> )}
      {showMyPosts && ( <MyPosts onClose={() => setShowMyPosts(false)} /> )}
    </div>
  );
}