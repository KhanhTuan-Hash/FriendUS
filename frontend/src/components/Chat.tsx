import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, User, Plus, X, Globe, Lock, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { ChatDetail } from './ChatDetail';
import { 
  getLocalConversations, 
  saveLocalConversations, 
  getChatMessages, 
  saveChatMessage   
} from '../utils/chatDatabase';

interface ChatConversation {
  id: number;
  name: string;
  avatar: string;
  type: 'individual' | 'group';
  lastMessage: string;
  time: string;
  unread: number;
  participants?: string[];
  creator?: string; // Added creator field for deletion logic
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
  isSystem?: boolean; 
}

interface UserResult {
  username: string;
  avatar: string;
}

// --- SIMULATION CONSTANTS ---
// We assume the logged-in user is 'Minh Nguyen' for testing ownership/deletion.
const CURRENT_USER_USERNAME = 'Minh Nguyen';

// --- DUMMY DATA FOR FALLBACK MODE ---
const DUMMY_CONVERSATIONS: ChatConversation[] = [
  // Removed Hanoi Trip Squad (id: 1) as requested.
  {
    id: 2,
    name: 'Minh Nguyen',
    avatar: '👨',
    type: 'individual',
    lastMessage: 'Thanks for splitting the bill!',
    time: '9:15 AM',
    unread: 0,
    creator: 'Minh Nguyen', // Current user created this chat
  }
];

const DUMMY_MESSAGES: Record<number, Message[]> = {
  // Removed messages for chat ID 1
  2: [
    { id: 1, sender: 'Minh', content: 'Thanks for splitting the bill!', time: '9:15 AM', isMe: false }
  ]
};

const DUMMY_USERS: UserResult[] = [
  { username: 'Linh Tran', avatar: '👩' },
  { username: 'Minh Nguyen', avatar: '👨' },
  { username: 'Tuan Le', avatar: '😎' },
  { username: 'Hoa Pham', avatar: '🌸' }
];

export function Chat() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);

  // Create Chaht States
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [chatType, setChatType] = useState<'private' | 'public'>('private');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // REAL DATA STATE
  const [messagesDatabase, setMessagesDatabase] = useState<Record<number, Message[]>>(DUMMY_MESSAGES);
  const [conversationsList, setConversationsList] = useState<ChatConversation[]>([]);
  
  // Search Users State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserResult[]>(DUMMY_USERS);

  // Helper to check if response is valid JSON
  const isJson = (response: Response) => {
    const contentType = response.headers.get("content-type");
    return contentType && contentType.includes("application/json");
  };

  // 1. Fetch Conversations on Mount
  useEffect(() => {
    const initData = () => {
      // A. Load from LocalStorage 
      let localData = getLocalConversations();
      
      // If LocalStorage None, use Dummy Data and save
      if (localData.length === 0) {
        localData = DUMMY_CONVERSATIONS;
        saveLocalConversations(localData);
      }
      setConversationsList(localData);

      // B. Check URL chat
      const activeChatId = searchParams.get('activeChat');
      if (activeChatId) {
        const chatToOpen = localData.find((c: any) => c.id === Number(activeChatId));
        if (chatToOpen) {
          setSelectedChat(chatToOpen);
          // Load messages for this chat immediately
          const msgs = getChatMessages(chatToOpen.id);
          setMessagesDatabase(prev => ({...prev, [chatToOpen.id]: msgs}));
        }
      }
    };

    initData();
  }, [searchParams]);

  // 2. Fetch Messages for a specific chat
  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`);
      if (response.ok && isJson(response)) {
        const data = await response.json();
        setMessagesDatabase(prev => ({ ...prev, [chatId]: data }));
      } else {
        throw new Error("Backend not JSON");
      }
    } catch (error) {
      // Fallback to LocalStorage
      const localMessages = getChatMessages(chatId);
      setMessagesDatabase(prev => ({
        ...prev,
        [chatId]: localMessages
      }));
    }
  };

  // 3. Handle Chat Selection
  const handleSelectChat = (conversation: ChatConversation) => {
    setSelectedChat(conversation);
    fetchMessages(conversation.id);
  };

  // 4. Handle Sending Message
  const handleSendMessage = async (content: string) => {
    if (!selectedChat) return;

    const optimisticMessage: Message = {
      id: Date.now(),
      sender: 'You',
      content: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    try {
      const response = await fetch(`/api/chat/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok && isJson(response)) {
        const savedMessage = await response.json();
        setMessagesDatabase(prev => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), savedMessage]
        }));
        setConversationsList(prev => prev.map(c => 
          c.id === selectedChat.id 
            ? { ...c, lastMessage: content, time: savedMessage.time } 
            : c
        ));
      } else {
        throw new Error("Backend failed");
      }
    } catch (error) {
      // 1.Save DB
      saveChatMessage(selectedChat.id, optimisticMessage); 

      // 2. Update State Message
      setMessagesDatabase(prev => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), optimisticMessage]
      }));

      //3. Update State List Chat
      const updatedConversations = conversationsList.map(c => 
        c.id === selectedChat.id 
          ? { ...c, lastMessage: content, time: optimisticMessage.time } 
          : c
      );
      setConversationsList(updatedConversations);
      saveLocalConversations(updatedConversations);
    }
  };

  // 5. Handle Leaving Chat
  const handleLeaveChat = async (chatId: number) => {
    const updatedList = conversationsList.filter(c => c.id !== chatId);
    setConversationsList(updatedList);
    saveLocalConversations(updatedList);
    setSelectedChat(null);
    window.history.pushState({}, '', '/chat'); // Clear URL params
  };

  // 6. Handle Create Chat
  const handleCreateChat = async () => {
    if (newChatName.trim()) {
      const newConversation: ChatConversation = {
          id: Date.now(),
          name: newChatName,
          avatar: newChatName.charAt(0).toUpperCase(),
          type: chatType === 'public' ? 'group' : 'individual',
          lastMessage: 'You created this group',
          time: 'Just now',
          unread: 0,
          participants: selectedUsers,
          creator: CURRENT_USER_USERNAME
      };
        
      const updatedList = [newConversation, ...conversationsList];
      setConversationsList(updatedList);
      saveLocalConversations(updatedList);
      
      setShowCreateChat(false);
      setNewChatName('');
      setSelectedUsers([]);
      handleSelectChat(newConversation);
    }
  };

  // 7. Handle Delete Chat
  const handleDeleteChat = async (chatId: number) => {
    const confirmed = window.prompt("Type 'DELETE' to confirm permanent deletion of this chat.");
    if (confirmed !== "DELETE") return;

    const updatedList = conversationsList.filter(c => c.id !== chatId);
    setConversationsList(updatedList);
    saveLocalConversations(updatedList);
    setSelectedChat(null);
  };

  // 7. Search Users for Invitation
  useEffect(() => {
    const searchUsers = async () => {
      const query = userSearchQuery.toLowerCase();
      if (!query) {
         setUserSearchResults(DUMMY_USERS);
         return;
      }
      // Mock search local
      const results = DUMMY_USERS.filter(u => u.username.toLowerCase().includes(query));
      setUserSearchResults(results);
    };
    searchUsers();
  }, [userSearchQuery]);

  const toggleUserSelection = (username: string) => {
    setSelectedUsers(prev =>
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  // Filter conversations safely
  const filteredConversations = conversationsList.filter((conv) =>
    (conv.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER ---
  
  if (selectedChat) {
    return (
      <ChatDetail
        chat={selectedChat}
        onBack={() => {
            setSelectedChat(null);
            window.history.pushState({}, '', '/chat'); 
        }}
        messages={messagesDatabase[selectedChat.id] || []}
        onSendMessage={handleSendMessage}
        handleLeaveChat={handleLeaveChat}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl dark:text-white font-bold">Messages</h2>
          <button
            onClick={() => setShowCreateChat(true)}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>
        
        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center gap-3 mb-4 border border-gray-100 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent dark:text-white"
          />
        </div>
      </div>

      {/* Create Chat Modal */}
      {showCreateChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-lg font-bold dark:text-white">Create New Chat</h3>
              <button onClick={() => setShowCreateChat(false)}><X className="w-5 h-5 text-gray-500"/></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Chat Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Trip 2024"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Chat Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setChatType('private')}
                    className={`p-3 border rounded-lg flex items-center gap-2 ${chatType === 'private' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Lock className="w-4 h-4" /> <span className="text-sm font-medium">Private</span>
                  </button>
                  <button
                    onClick={() => setChatType('public')}
                    className={`p-3 border rounded-lg flex items-center gap-2 ${chatType === 'public' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Globe className="w-4 h-4" /> <span className="text-sm font-medium">Public</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 dark:text-gray-300">Add Participants</label>
                <input
                    type="text"
                    placeholder="Search user..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2 dark:border-gray-700">
                  {userSearchResults.map((user) => (
                    <button
                      key={user.username}
                      onClick={() => toggleUserSelection(user.username)}
                      className={`w-full p-2 rounded-lg flex items-center gap-3 ${selectedUsers.includes(user.username) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'}`}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">{user.avatar}</div>
                      <span className="text-sm flex-1 text-left">{user.username}</span>
                      {selectedUsers.includes(user.username) && <Check className="w-4 h-4"/>}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateChat}
                disabled={!newChatName.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div 
              key={conversation.id}
              onClick={() => handleSelectChat(conversation)}
              className="group w-full bg-white dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600 flex items-center shadow-sm"
            >
              <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center text-xl shadow-inner">
                    {conversation.avatar}
                  </div>
                  {conversation.unread > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white">{conversation.unread}</div>}
              </div>

              <div className="flex-1 ml-4 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{conversation.name}</h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{conversation.time}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate group-hover:text-blue-600 transition-colors">
                      {conversation.lastMessage}
                  </p>
              </div>

              {conversation.creator === CURRENT_USER_USERNAME && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(conversation.id); }}
                  className="ml-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400 opacity-60">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4"><User className="w-10 h-10"/></div>
            <p>No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for Check icon (was missing in Lucide import sometimes)
const Check = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);