import { useState, useEffect } from 'react';
import { X, Search, UserMinus, MessageCircle, MoreVertical, Users as UsersIcon } from 'lucide-react';
import { getFriends, removeFriend, type Friend } from '../utils/profileDatabase';

interface ManageFriendsProps {
  onClose: () => void;
}

export function ManageFriends({ onClose }: ManageFriendsProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');

  useEffect(() => {
    setFriends(getFriends());
  }, []);

  const handleRemoveFriend = (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      removeFriend(friendId);
      setFriends(getFriends());
    }
  };

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || friend.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const onlineFriends = friends.filter(f => f.status === 'online').length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">Manage Friends</h2>
            <p className="text-blue-100 text-sm">
              {friends.length} friends • {onlineFriends} online
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends by name, username, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({friends.length})
            </button>
            <button
              onClick={() => setFilterStatus('online')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'online'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Online ({onlineFriends})
            </button>
            <button
              onClick={() => setFilterStatus('offline')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'offline'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Offline ({friends.length - onlineFriends})
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No friends found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-600"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-3xl">
                        {friend.avatar}
                      </div>
                      {friend.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-3 border-white dark:border-gray-700 rounded-full"></div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                        {friend.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {friend.username}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          📍 {friend.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3 h-3" />
                          {friend.mutualFriends} mutual
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {friend.status === 'online' ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {friend.lastActive}
                          </span>
                        ) : (
                          <span>Last active {friend.lastActive}</span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Friend Since */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Friends since {friend.friendSince}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}