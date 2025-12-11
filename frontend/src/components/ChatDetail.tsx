import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  DollarSign,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Plus,
  Check,
  ArrowRight,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  LogOut,
  X,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';

// --- STUB COMPONENTS (Assuming these were missing or caused conflicts) ---
const DebtGraph = ({ relations, currentUser }: any) => <div className="p-4 text-gray-500">Debt Graph Stub</div>;
const ClockTimePicker = ({ value, onChange }: any) => <div className="p-4 text-gray-500">Time Picker Stub: {value}</div>;
const LocationPicker = ({ value, onChange }: any) => <div className="p-4 text-gray-500">Location Picker Stub: {value}</div>;
const AITripPlanner = ({ onClose, onAccept, chatContext }: any) => <div className="p-4 text-gray-500">AI Planner Stub</div>;
// --- END STUB COMPONENTS ---

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
  isSystem?: boolean;
}

interface Props {
  chat: ChatConversation;
  onBack: () => void;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>; 
  handleLeaveChat: (chatId: number) => void;
}

interface FinanceItem {
  id: number;
  person: string;
  amount: number;
  description: string;
  type: 'debt' | 'lend';
  settled: boolean;
}

interface PlannerActivity {
  id: number;
  time: string;
  title: string;
  location: string;
  completed: boolean;
  date: string;
  description?: string;
}

const DUMMY_FINANCE: FinanceItem[] = [
  { id: 1, person: 'Linh', amount: 500000, description: 'Hotel booking (2 nights)', type: 'debt', settled: false },
  { id: 2, person: 'Minh', amount: 150000, description: 'Bus tickets', type: 'lend', settled: true },
  { id: 3, person: 'Tuan', amount: 200000, description: 'Dinner at local restaurant', type: 'debt', settled: false }
];

const DUMMY_ACTIVITIES: PlannerActivity[] = [
  { id: 1, time: '8:00 AM', title: 'Meet at bus station', location: 'Ben Xe Mien Dong', completed: true, date: '2025-12-08', description: 'Departure to Hanoi' },
  { id: 3, time: '2:00 PM', title: 'Visit Hoan Kiem Lake', location: 'Old Quarter, Hanoi', completed: false, date: '2025-12-09', description: 'Walking tour around the lake' }
];

export function ChatDetail({ chat, onBack, messages, onSendMessage, handleLeaveChat }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'finance' | 'planner'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [financeItems, setFinanceItems] = useState<FinanceItem[]>(DUMMY_FINANCE);
  const [plannerActivities, setPlannerActivities] = useState<PlannerActivity[]>(DUMMY_ACTIVITIES);

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    date: new Date().toISOString().substring(0, 10),
    time: '09:00',
    location: '',
    description: ''
  });

  // This is the useEffect that correctly uses activeTab within the ChatDetail component
  useEffect(() => {
    // Logic to refetch Finance or Planner data when the tab changes,
    // which requires both activeTab (state) and chat.id (prop).
    if (activeTab === 'finance') {
        // fetch finance data for chat.id
        setFinanceItems(DUMMY_FINANCE);
    } else if (activeTab === 'planner') {
        // fetch planner data for chat.id
        setPlannerActivities(DUMMY_ACTIVITIES);
    }
  }, [activeTab, chat.id]);

  const handleAddActivity = () => {
    const activityDateTime = new Date(`${activityForm.date}T${activityForm.time}`);
    const currentDateTime = new Date();
    const isCompleted = activityDateTime < currentDateTime;
    
    const newActivity: PlannerActivity = {
      id: plannerActivities.length + 1,
      time: activityForm.time,
      title: activityForm.title,
      location: activityForm.location,
      completed: isCompleted,
      date: activityForm.date,
      description: activityForm.description
    };
    
    setPlannerActivities([...plannerActivities, newActivity]);
    setShowAddActivity(false);
    setActivityForm({ title: '', date: new Date().toISOString().substring(0, 10), time: '09:00', location: '', description: '' });
  };

  const getTimelineDates = () => {
    const uniqueDates = Array.from(new Set(plannerActivities.map(a => a.date)));
    return uniqueDates.sort();
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && !isSending) {
      try {
        setIsSending(true);
        await onSendMessage(newMessage); 
        setNewMessage('');
      } catch (error) {
        console.error("Failed to send message", error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const totalDebt = financeItems
    .filter((item) => item.type === 'debt' && !item.settled)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalLend = financeItems
    .filter((item) => item.type === 'lend' && !item.settled)
    .reduce((sum, item) => sum + item.amount, 0);

  const handleAcceptAISuggestions = (aiActivities: any[]) => {
    const newActivities = aiActivities.map((ai, index) => ({
      id: plannerActivities.length + index + 1,
      time: ai.time,
      title: ai.title,
      location: ai.location,
      completed: false,
      date: '2025-12-10', 
      description: ai.description
    }));
    
    setPlannerActivities([...plannerActivities, ...newActivities]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 dark:text-gray-300" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xl">
              {chat.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-lg dark:text-white">{chat.name}</h2>
              {chat.participants && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chat.participants.join(', ')}
                </p>
              )}
            </div>
            
            <button
              onClick={() => alert('Starting voice call...')}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Voice Call"
            >
              <Phone className="w-5 h-5 dark:text-gray-300" />
            </button>
            <button
              onClick={() => alert('Starting video call...')}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Video Call"
            >
              <Video className="w-5 h-5 dark:text-gray-300" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 dark:text-gray-300" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    onClick={() => {
                      const confirmed = window.prompt("Type 'LEAVE' to confirm leaving this chat.");
                      if (confirmed === 'LEAVE') {
                        handleLeaveChat(chat.id);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-3 text-red-600 dark:text-red-400 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Chat
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'finance'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Finance</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'planner'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Planner</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isSystem ? 'justify-center' : message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {message.isSystem ? (
                    <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                      {message.content}
                    </div>
                  ) : (
                    <div
                      className={`max-w-md px-4 py-2 rounded-2xl ${
                        message.isMe
                          ? 'bg-blue-600 dark:bg-blue-700 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'
                      }`}
                    >
                      {!message.isMe && (
                        <p className="text-xs mb-1 opacity-70">{message.sender}</p>
                      )}
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">{message.time}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              {chat.type === 'group' && (
                <DebtGraph
                  relations={[
                    { from: 'You', to: 'Linh', amount: 500000 },
                    { from: 'You', to: 'Tuan', amount: 200000 },
                    { from: 'Minh', to: 'You', amount: 150000 },
                    { from: 'Tuan', to: 'Linh', amount: 300000 },
                    { from: 'Hoa', to: 'Minh', amount: 250000 }
                  ]}
                  currentUser="You"
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="text-red-800 dark:text-red-300">You Owe</h3>
                  </div>
                  <p className="text-2xl text-red-600 dark:text-red-400">
                    {totalDebt.toLocaleString()} ₫
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-green-800 dark:text-green-300">You Are Owed</h3>
                  </div>
                  <p className="text-2xl text-green-600 dark:text-green-400">
                    {totalLend.toLocaleString()} ₫
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="dark:text-white">Transactions</h3>
                  <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {financeItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.type === 'debt'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {item.type === 'debt' ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : (
                          <TrendingUp className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.person}</p>
                        <p className="dark:text-white">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`${
                            item.type === 'debt' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {item.amount.toLocaleString()} ₫
                        </p>
                        {item.settled && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Settled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="dark:text-white">Trip Itinerary</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAIPlanner(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                      <Sparkles className="w-4 h-4" />
                      AI Suggest
                    </button>
                    <button 
                      onClick={() => setShowAddActivity(true)}
                      className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md">
                      <Plus className="w-4 h-4" />
                      Add Activity
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => console.log('View changed')}
                    className={`px-4 py-2 rounded-lg transition-colors 
                      ${true
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => console.log('View changed')}
                    className={`px-4 py-2 rounded-lg transition-colors 
                      ${false
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => console.log('View changed')}
                    className={`px-4 py-2 rounded-lg transition-colors 
                      ${false
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-x-auto">
                <div className="flex items-start gap-6 min-w-max pb-4">
                  {getTimelineDates().map((date) => {
                    const dateActivities = plannerActivities.filter((a) => a.date === date);
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <div key={date} className="flex flex-col items-center min-w-[280px]">
                        <div className="text-center mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{dayName}</p>
                          <p className="text-2xl dark:text-white">{dayNum}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{monthName}</p>
                        </div>

                        <div className="w-full space-y-3">
                          {dateActivities.length > 0 ? (
                            dateActivities.map((activity) => (
                              <div
                                key={activity.id}
                                className={`relative bg-gradient-to-br ${
                                  activity.completed
                                    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                                    : 'from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-purple-700'
                                } border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                              >
                                {activity.completed && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{activity.time}</span>
                                </div>

                                <h4 className="text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {activity.title}
                                </h4>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{activity.location}</span>
                                </div>

                                {activity.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                                    {activity.description}
                                  </p>
                                )}

                                <div className="absolute -right-5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600">
                                  <ArrowRight className="w-5 h-5" />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No activities</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Activity Modal */}
              {showAddActivity && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between rounded-t-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg">Add New Activity</h3>
                          <p className="text-xs text-blue-100">Plan your trip itinerary</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAddActivity(false)}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                      <div>
                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Activity Title
                        </label>
                        <input
                          type="text"
                          placeholder=""
                          value={activityForm.title}
                          onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                          </label>
                          <input
                            type="date"
                            value={activityForm.date}
                            onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time
                          </label>
                          <input
                            type="time"
                            value={activityForm.time}
                            onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
                        <ClockTimePicker
                          value={activityForm.time}
                          onChange={(time: string) => setActivityForm({ ...activityForm, time })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <LocationPicker
                          value={activityForm.location}
                          onChange={(location: string) => setActivityForm({ ...activityForm, location })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                          Description / Notes
                        </label>
                        <textarea
                          placeholder="Add any additional details about this activity..."
                          value={activityForm.description}
                          onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex gap-3 rounded-b-2xl">
                      <button
                        onClick={() => setShowAddActivity(false)}
                        className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddActivity}
                        disabled={!activityForm.title || !activityForm.date || !activityForm.time}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      >
                        Save Activity
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('Select image or video to send...')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Send Media"
              >
                <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <input
                type="text"
                placeholder="Aa"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSending}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-full outline-none focus:bg-gray-200 dark:focus:bg-gray-600 transition-colors disabled:opacity-50"
              />
              
              <button
                onClick={handleSendMessage}
                className="w-12 h-12 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600"
                disabled={!newMessage.trim() || isSending}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showAIPlanner && (
      <AITripPlanner 
        onClose={() => setShowAIPlanner(false)}
        onAccept={handleAcceptAISuggestions}
        chatContext={messages
          .filter(m => !m.isSystem) 
          .map(m => m.content)
          .join('. ')
        } 
      />
    )}
    </div>
  );
}