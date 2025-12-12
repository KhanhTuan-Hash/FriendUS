import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';// Hooks for URL params and navigation
import {
  Camera, Edit2, MapPin, Mail, Phone, Calendar, Users, Heart,
  Settings, LogOut, Check, X, Upload, FileText,
  UserPlus, UserMinus, MessageCircle, Clock // New icons
} from 'lucide-react';
import { getUserById, checkFriendStatus, FriendStatus } from '../utils/profileDatabase';
import { findOrCreateChat } from '../utils/chatDatabase';

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
  const { userId } = useParams(); // Get ID from URL
  const navigate = useNavigate();

   // Determine if this is the current user's profile
  // If no userId in URL, or userId matches current user ID (999), it's "Me"
  const myInfo = { username: 'Minh Nguyen', id: '999' }; 
  const currentUserId = '999'; 

  const targetUserId = userId || currentUserId;
  const isOwnProfile = targetUserId === currentUserId;

  const [profile, setProfile] = useState<any>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(initialProfile);

  // New State for Friend Actions
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('me');
  const [isLoading, setIsLoading] = useState(true);

  // Old Modal States
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showManageFriends, setShowManageFriends] = useState(false);
  const [showSavedPlaces, setShowSavedPlaces] = useState(false);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. Fetch Profile Data on Load (Simulated API call)
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        if (isOwnProfile) {
          // Load my own profile
          setFriendStatus('me');
        } else {
          const user = getUserById(targetUserId);
          if(user) setProfile(user);
          setFriendStatus(checkFriendStatus(targetUserId));
        }
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [targetUserId, isOwnProfile]);

  const handleMessage = () => {
    // 1. Take Id chat
    const chatId = findOrCreateChat(
        { username: myInfo.username }, // your info
        { 
        name: profile.name,         
        username: profile.username, 
        avatar: profile.avatar 
        } 
    );

    // 2. Go to chat
    navigate(`/chat?activeChat=${chatId}`);
  };

  // Handle Friend Actions (Add, Unfriend, Cancel)
  const handleFriendAction = async () => {
    // Simulate API call
    if (friendStatus === 'none') {
      setFriendStatus('pending'); // Send Request
    } else if (friendStatus === 'pending') {
      setFriendStatus('none'); // Cancel Request
    } else if (friendStatus === 'friends') {
      if(window.confirm("Are you sure you want to unfriend?")) {
         setFriendStatus('none'); // Unfriend
      }
    }
  };

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

  if (isLoading) return <div className="p-8 text-center">Loading Profile...</div>;

  if (fetchError) {
      return (
          <div className="max-w-4xl mx-auto p-8 text-center bg-red-100 dark:bg-red-900/50 rounded-lg m-4">
              <p className="text-red-800 dark:text-red-400 font-bold">Error Loading Profile:</p>
              <p className="text-red-700 dark:text-red-300">{fetchError}</p>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 transition-colors duration-300">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800" />
        
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 md:-mt-16 gap-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center text-6xl overflow-hidden">
               {/* Avatar Display Logic */}
               {(isEditing ? editedProfile.avatar : profile.avatar).startsWith('data:') ? (
                <img src={isEditing ? editedProfile.avatar : profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{isEditing ? editedProfile.avatar : profile.avatar}</span>
              )}
            </div>
            
            {/* Only show Edit Avatar button if it's My Profile and currently Editing */}
            {isOwnProfile && isEditing && (
              <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Avatar Picker (Only for My Profile + Edit Mode) */}
          {isOwnProfile && isEditing && showAvatarPicker && (
             <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-5 gap-3">
                    {avatarOptions.map((av, idx) => (
                        <button key={idx} onClick={() => handleAvatarChange(av)} className="text-2xl">{av}</button>
                    ))}
                </div>
             </div>
          )}

          {/* User Info & Actions Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
            
            {/* Name/Username Inputs or Display */}
            <div className="flex-1 w-full md:w-auto">
                {isOwnProfile && isEditing ? (
                    <div className="space-y-3 mb-4">
                        <input value={editedProfile.name} onChange={e => setEditedProfile({...editedProfile, name: e.target.value})} className="block w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Name"/>
                        <input value={editedProfile.username} onChange={e => setEditedProfile({...editedProfile, username: e.target.value})} className="block w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Username"/>
                    </div>
                ) : (
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            {profile.name}
                            {/* Show 'Friend' badge if viewing a friend's profile */}
                            {!isOwnProfile && friendStatus === 'friends' && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full border border-green-200">Friend</span>
                            )}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">{profile.username}</p>
                    </div>
                )}
            </div>

            {/* ACTION BUTTONS (Logic split between Me vs Others) */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {isOwnProfile ? (
                    isEditing ? (
                      <>
                        <button onClick={handleSave} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"><Check size={18}/> Save</button>
                        <button onClick={handleCancel} className="flex-1 md:flex-none bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center justify-center gap-2"><X size={18}/> Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="flex-1 md:flex-none bg-gray-100 dark:bg-gray-700 dark:text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200">
                        <Edit2 size={18} /> Edit Profile
                      </button>
                    )
                  ) : (
                    <>
                      {/* Friend Actions */}
                      {friendStatus === 'none' && (
                        <button onClick={handleFriendAction} className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-700">
                          <UserPlus size={18} /> Add Friend
                        </button>
                      )}
                      {friendStatus === 'pending' && (
                        <button onClick={handleFriendAction} className="flex-1 md:flex-none bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
                          <Clock size={18} /> Pending
                        </button>
                      )}
                      {friendStatus === 'friends' && (
                        <button onClick={handleFriendAction} className="flex-1 md:flex-none bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100">
                          <UserMinus size={18} /> Unfriend
                        </button>
                      )}

                      {/* Message Button - Đã gắn logic mới */}
                      <button 
                        onClick={handleMessage}
                        className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 shadow-md"
                      >
                        <MessageCircle size={18} /> Message
                      </button>
                    </>
                  )}
                </div>
          </div>
              
          {/* Avatar Picker */}
          {isOwnProfile && isEditing && showAvatarPicker && (
             <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-wrap gap-2">
                {avatarOptions.map((av, idx) => (
                    <button key={idx} onClick={() => handleAvatarChange(av)} className="text-2xl hover:scale-110">{av}</button>
                ))}
             </div>
          )}
          
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4">
             <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl text-blue-600 dark:text-blue-400">{profile.stats.posts}</p>
                <p className="text-sm text-gray-500">Posts</p>
             </div>
             <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl text-purple-600 dark:text-purple-400">{profile.stats.friends}</p>
                <p className="text-sm text-gray-500">Friends</p>
             </div>
             <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl text-green-600 dark:text-green-400">{profile.stats.trips}</p>
                <p className="text-sm text-gray-500">Trips</p>
             </div>
          </div>
        </div>
      </div>

      {/* Profile Info Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl mb-4 dark:text-white font-semibold">About</h3>
          
          <div className="space-y-4">
            {/* Bio */}
            <div>
                <label className="text-sm text-gray-500 block mb-1">Bio</label>
                {isOwnProfile && isEditing ? (
                    <textarea value={editedProfile.bio} onChange={e => setEditedProfile({...editedProfile, bio: e.target.value})} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white" rows={3}/>
                ) : (
                    <p className="dark:text-gray-200">{profile.bio}</p>
                )}
            </div>
            {/* Location */}
            <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Location</label>
                    {isOwnProfile && isEditing ? (
                        <input value={editedProfile.location} onChange={e => setEditedProfile({...editedProfile, location: e.target.value})} className="w-full border p-1 rounded mt-1 dark:bg-gray-700 dark:text-white"/>
                    ) : (
                        <p className="dark:text-gray-200">{profile.location}</p>
                    )}
                </div>
            </div>
            {/* Join Date */}
            <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                    <label className="text-xs text-gray-500">Joined</label>
                    <p className="dark:text-gray-200">{profile.joinDate}</p>
                </div>
            </div>
            
            {/* Only show sensitive info (Email/Phone) if it's Me or we are Friends */}
            {(isOwnProfile || friendStatus === 'friends') && (
                <>
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">Email</label>
                            {isOwnProfile && isEditing ? (
                                <input value={editedProfile.email} onChange={e => setEditedProfile({...editedProfile, email: e.target.value})} className="w-full border p-1 rounded mt-1 dark:bg-gray-700 dark:text-white"/>
                            ) : (
                                <p className="dark:text-gray-200">{profile.email}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">Phone</label>
                             {isOwnProfile && isEditing ? (
                                <input value={editedProfile.phone} onChange={e => setEditedProfile({...editedProfile, phone: e.target.value})} className="w-full border p-1 rounded mt-1 dark:bg-gray-700 dark:text-white"/>
                            ) : (
                                <p className="dark:text-gray-200">{profile.phone}</p>
                            )}
                        </div>
                    </div>
                </>
            )}
          </div>
      </div>

      {/* Settings List - SHOW ONLY IF IT IS MY PROFILE */}
      {isOwnProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <button className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 dark:text-white">
                <Settings className="w-5 h-5 text-gray-500" /> Settings & Privacy
            </button>
            <button onClick={() => setShowManageFriends(true)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 dark:text-white">
                <Users className="w-5 h-5 text-gray-500" /> Manage Friends
            </button>
            <button onClick={() => setShowSavedPlaces(true)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 dark:text-white">
                <Heart className="w-5 h-5 text-gray-500" /> Saved Places
            </button>
             <button onClick={() => setShowMyPosts(true)} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 dark:text-white">
                <FileText className="w-5 h-5 text-gray-500" /> My Posts
            </button>
            <button onClick={onLogout} className="w-full px-6 py-4 flex items-center gap-3 hover:bg-red-50 text-red-600">
                <LogOut className="w-5 h-5" /> Log Out
            </button>
          </div>
      )}

      {/* If viewing someone else's profile, we can show their public activity here */}
      {!isOwnProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold mb-4 dark:text-white">Recent Activity</h3>
              <p className="text-gray-500 italic text-center py-4">No recent public posts.</p>
          </div>
      )}

      {/* Modals */}
      {showManageFriends && <ManageFriends onClose={() => setShowManageFriends(false)} />}
      {showSavedPlaces && <SavedPlaces onClose={() => setShowSavedPlaces(false)} />}
      {showMyPosts && <MyPosts onClose={() => setShowMyPosts(false)} />}
    </div>
  );
}
