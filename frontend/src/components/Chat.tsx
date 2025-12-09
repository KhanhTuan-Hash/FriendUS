import { useState } from 'react';
import { Search, Users, User, Plus, X, Globe, Lock } from 'lucide-react';
import { ChatDetail } from './ChatDetail';

interface ChatConversation {
  id: number;
  name: string;
  avatar: string;
  type: 'individual' | 'group';
  lastMessage: string;
  time: string;
  unread: number;
  participants?: string[];
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
  isSystem?: boolean; // For join/leave notifications
}

// DUMMY MESSAGE DATABASE - Maps chat IDs to their messages
const initialMessagesDatabase: Record<number, Message[]> = {
  1: [ // Hanoi Trip Squad
    {
      id: 1,
      sender: 'Minh',
      content: 'Hey everyone! Ready for the trip tomorrow?',
      time: '9:00 AM',
      isMe: false
    },
    {
      id: 2,
      sender: 'You',
      content: 'Yes! Can\'t wait. What time are we meeting?',
      time: '9:05 AM',
      isMe: true
    },
    {
      id: 3,
      sender: 'Linh',
      content: 'I booked the hotel for all of us. Check the planner tab!',
      time: '9:10 AM',
      isMe: false
    },
    {
      id: 4,
      sender: 'You',
      content: 'Thanks! I\'ll settle my share later. Added it to finance.',
      time: '9:15 AM',
      isMe: true
    }
  ],
  2: [ // Minh Nguyen
    {
      id: 1,
      sender: 'Minh',
      content: 'Hey! How are you doing?',
      time: '8:30 AM',
      isMe: false
    },
    {
      id: 2,
      sender: 'You',
      content: 'I\'m good! How about you?',
      time: '8:35 AM',
      isMe: true
    },
    {
      id: 3,
      sender: 'Minh',
      content: 'Thanks for splitting the bill!',
      time: '9:15 AM',
      isMe: false
    }
  ],
  3: [ // Da Nang Beach Crew
    {
      id: 1,
      sender: 'Tuan',
      content: 'Beach day tomorrow at 8 AM',
      time: 'Yesterday',
      isMe: false
    },
    {
      id: 2,
      sender: 'Mai',
      content: 'Perfect! I\'ll bring the snacks',
      time: 'Yesterday',
      isMe: false
    }
  ],
  4: [ // Linh Tran
    {
      id: 1,
      sender: 'Linh',
      content: 'The photos from Hoi An are amazing!',
      time: 'Yesterday',
      isMe: false
    },
    {
      id: 2,
      sender: 'You',
      content: 'Thanks! That sunset was incredible',
      time: 'Yesterday',
      isMe: true
    }
  ],
  5: [ // Sapa Adventure
    {
      id: 1,
      sender: 'Khoa',
      content: 'Don\'t forget warm clothes',
      time: '2 days ago',
      isMe: false
    },
    {
      id: 2,
      sender: 'An',
      content: 'Already packed everything!',
      time: '2 days ago',
      isMe: false
    }
  ]
};

const conversations: ChatConversation[] = [
  {
    id: 1,
    name: 'Hanoi Trip Squad',
    avatar: '👥',
    type: 'group',
    lastMessage: 'Linh: See you at the Old Quarter!',
    time: '10:30 AM',
    unread: 3,
    participants: ['Minh', 'Linh', 'Tuan', 'Hoa']
  },
  {
    id: 2,
    name: 'Minh Nguyen',
    avatar: '👨',
    type: 'individual',
    lastMessage: 'Thanks for splitting the bill!',
    time: '9:15 AM',
    unread: 0
  },
  {
    id: 3,
    name: 'Da Nang Beach Crew',
    avatar: '🏖️',
    type: 'group',
    lastMessage: 'Tuan: Beach day tomorrow at 8 AM',
    time: 'Yesterday',
    unread: 5,
    participants: ['Tuan', 'Mai', 'Khoa']
  },
  {
    id: 4,
    name: 'Linh Tran',
    avatar: '👩',
    type: 'individual',
    lastMessage: 'The photos from Hoi An are amazing!',
    time: 'Yesterday',
    unread: 0
  },
  {
    id: 5,
    name: 'Sapa Adventure',
    avatar: '⛰️',
    type: 'group',
    lastMessage: 'Khoa: Don\'t forget warm clothes',
    time: '2 days ago',
    unread: 1,
    participants: ['Khoa', 'An', 'Binh', 'Cam']
  }
];

export function Chat() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [chatType, setChatType] = useState<'private' | 'public'>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // DUMMY MESSAGE DATABASE STATE
  const [messagesDatabase, setMessagesDatabase] = useState<Record<number, Message[]>>(initialMessagesDatabase);
  
  // DUMMY CONVERSATIONS DATABASE STATE - Make conversations dynamic
  const [conversationsList, setConversationsList] = useState<ChatConversation[]>(conversations);

  const availableUsers = ['Minh Nguyen', 'Linh Tran', 'Tuan Le', 'Hoa Pham', 'Mai Nguyen', 'Khoa Vo'];

  // Function to add a message to a specific chat
  const addMessage = (chatId: number, message: Message) => {
    setMessagesDatabase(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message]
    }));
  };

  // Function to handle leaving a chat
  const handleLeaveChat = (chatId: number) => {
    // Add system message
    const leaveMessage: Message = {
      id: (messagesDatabase[chatId]?.length || 0) + 1,
      sender: 'System',
      content: 'You left the chat',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: false,
      isSystem: true
    };
    addMessage(chatId, leaveMessage);
  };

  const handleCreateChat = () => {
    if (newChatName.trim() && selectedUsers.length > 0) {
      // Generate new chat ID
      const newChatId = Math.max(...conversationsList.map(c => c.id), 0) + 1;
      
      // Pick a random emoji for the avatar
      const avatars = ['🌟', '🎉', '🚀', '🌈', '⭐', '🎨', '🎭', '🎪', '🎬', '🎮'];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      // Create new conversation
      const newConversation: ChatConversation = {
        id: newChatId,
        name: newChatName,
        avatar: randomAvatar,
        type: 'group',
        lastMessage: 'You joined the chat',
        time: 'Just now',
        unread: 0,
        participants: selectedUsers.map(u => u.split(' ')[0]) // Get first names
      };
      
      // Add to conversations list
      setConversationsList(prev => [newConversation, ...prev]);
      
      // Create initial system message for joining
      const joinMessage: Message = {
        id: 1,
        sender: 'System',
        content: 'You joined the chat',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
        isSystem: true
      };
      
      // Initialize message database for this chat
      setMessagesDatabase(prev => ({
        ...prev,
        [newChatId]: [joinMessage]
      }));
      
      // Close modal and reset form
      setShowCreateChat(false);
      setNewChatName('');
      setSelectedUsers([]);
      
      // Automatically open the new chat
      setSelectedChat(newConversation);
    }
  };

  const toggleUserSelection = (user: string) => {
    setSelectedUsers(prev =>
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
    );
  };

  const filteredConversations = conversationsList.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedChat) {
    return (
      <ChatDetail
        chat={selectedChat}
        onBack={() => setSelectedChat(null)}
        messages={messagesDatabase[selectedChat.id] || []}
        addMessage={addMessage}
        handleLeaveChat={handleLeaveChat}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl dark:text-white">Messages</h2>
          <button
            onClick={() => setShowCreateChat(true)}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>
        
        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center gap-3 mb-4 transition-colors duration-300">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Create Chat Modal */}
      {showCreateChat && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl dark:text-white">Create New Chat</h3>
              <button
                onClick={() => setShowCreateChat(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-6">
              {/* Chat Name */}
              <div className="mb-6">
                <label className="block text-sm mb-2 dark:text-gray-300">Chat Name</label>
                <input
                  type="text"
                  placeholder="Enter chat name..."
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:placeholder-gray-500 transition-colors"
                />
              </div>

              {/* Chat Type */}
              <div className="mb-6">
                <label className="block text-sm mb-2 dark:text-gray-300">Chat Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setChatType('private')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      chatType === 'private'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Lock className="w-5 h-5 dark:text-gray-300" />
                    <div className="text-left">
                      <p className="font-semibold dark:text-white">Private</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Only invited members</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setChatType('public')}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      chatType === 'public'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Globe className="w-5 h-5 dark:text-gray-300" />
                    <div className="text-left">
                      <p className="font-semibold dark:text-white">Public</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Anyone can join</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Select Users */}
              <div className="mb-6">
                <label className="block text-sm mb-2 dark:text-gray-300">
                  Select Participants ({selectedUsers.length} selected)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <button
                      key={user}
                      onClick={() => toggleUserSelection(user)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedUsers.includes(user)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                        {user.charAt(0)}
                      </div>
                      <span className="flex-1 text-left dark:text-white">{user}</span>
                      {selectedUsers.includes(user) && (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreateChat}
                  disabled={!newChatName.trim() || selectedUsers.length === 0}
                  className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  Create Chat
                </button>
                <button
                  onClick={() => setShowCreateChat(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => setSelectedChat(conversation)}
            className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-all text-left border border-transparent dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">
                  {conversation.avatar}
                </div>
                {conversation.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    {conversation.unread}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="truncate flex items-center gap-2 dark:text-white">
                    {conversation.name}
                    {conversation.type === 'group' && (
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                    {conversation.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {conversation.lastMessage}
                </p>
                {conversation.type === 'group' && conversation.participants && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {conversation.participants.length} participants
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <User className="w-16 h-16 mx-auto mb-2 opacity-50" />
            <p>No conversations found</p>
          </div>
        </div>
      )}
    </div>
  );
}