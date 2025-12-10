import { useState } from 'react';
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
  Film,
  Bold,
  Italic,
  Link as LinkIcon,
  LogOut,
  X,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { DebtGraph } from './DebtGraph';
import { ClockTimePicker } from './ClockTimePicker';
import { LocationPicker } from './LocationPicker';
import { AITripPlanner } from './AITripPlanner';

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

interface Props {
  chat: ChatConversation;
  onBack: () => void;
  messages: Message[];
  addMessage: (chatId: number, message: Message) => void;
  handleLeaveChat: (chatId: number) => void;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
  isSystem?: boolean; // For join/leave notifications
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

// Initial dummy activities - will be replaced with state
const financeItems: FinanceItem[] = [
  {
    id: 1,
    person: 'Linh',
    amount: 500000,
    description: 'Hotel booking (2 nights)',
    type: 'debt',
    settled: false
  },
  {
    id: 2,
    person: 'Minh',
    amount: 150000,
    description: 'Bus tickets',
    type: 'lend',
    settled: true
  },
  {
    id: 3,
    person: 'Tuan',
    amount: 200000,
    description: 'Dinner at local restaurant',
    type: 'debt',
    settled: false
  }
];

const initialPlannerActivities: PlannerActivity[] = [
  {
    id: 1,
    time: '8:00 AM',
    title: 'Meet at bus station',
    location: 'Ben Xe Mien Dong',
    completed: true,
    date: '2025-12-08',
    description: 'Departure to Hanoi'
  },
  {
    id: 2,
    time: '12:00 PM',
    title: 'Lunch at local restaurant',
    location: 'Pho 24',
    completed: true,
    date: '2025-12-08',
    description: 'Try the famous pho'
  },
  {
    id: 3,
    time: '2:00 PM',
    title: 'Visit Hoan Kiem Lake',
    location: 'Old Quarter, Hanoi',
    completed: false,
    date: '2025-12-09',
    description: 'Walking tour around the lake'
  },
  {
    id: 4,
    time: '6:00 PM',
    title: 'Dinner and night market',
    location: 'Night Market Street',
    completed: false,
    date: '2025-12-09',
    description: 'Shopping and street food'
  }
];

export function ChatDetail({ chat, onBack, messages, addMessage, handleLeaveChat }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'finance' | 'planner'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  
  // Planner states - DUMMY DATABASE
  const [plannerActivities, setPlannerActivities] = useState<PlannerActivity[]>(initialPlannerActivities);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [timelineView, setTimelineView] = useState<'day' | 'week' | 'month'>('day');
  const [activityForm, setActivityForm] = useState({
    title: '',
    date: '2025-12-08',
    time: '09:00',
    location: '',
    description: ''
  });

  // Function to add new activity to dummy database
  const handleAddActivity = () => {
    // Check if activity is in the past
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
    setActivityForm({ title: '', date: '2025-12-08', time: '09:00', location: '', description: '' });
  };

  // Get unique dates from activities and sort them
  const getTimelineDates = () => {
    const uniqueDates = Array.from(new Set(plannerActivities.map(a => a.date)));
    return uniqueDates.sort();
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      const message: Message = {
        id: messages.length + 1,
        sender: 'You',
        content: newMessage,
        time: new Date().toLocaleTimeString(),
        isMe: true
      };
      addMessage(chat.id, message);
      setNewMessage('');
    }
  };

  const totalDebt = financeItems
    .filter((item) => item.type === 'debt' && !item.settled)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalLend = financeItems
    .filter((item) => item.type === 'lend' && !item.settled)
    .reduce((sum, item) => sum + item.amount, 0);

  // Handler for accepting AI suggestions
  const handleAcceptAISuggestions = (aiActivities: any[]) => {
    const newActivities = aiActivities.map((ai, index) => ({
      id: plannerActivities.length + index + 1,
      time: ai.time,
      title: ai.title,
      location: ai.location,
      completed: false,
      date: '2025-12-10', // Default to tomorrow or a date selector
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
            
            {/* Call Buttons */}
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
            
            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 dark:text-gray-300" />
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to leave this chat?')) {
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

          {/* Tabs */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isSystem ? 'justify-center' : message.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {message.isSystem ? (
                    // System message (join/leave notifications)
                    <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                      {message.content}
                    </div>
                  ) : (
                    // Regular message
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

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              {/* Debt Graph - Only show for group chats */}
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

              {/* Summary */}
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

              {/* Transactions */}
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

          {/* Planner Tab */}
          {activeTab === 'planner' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors overflow-hidden">
              {/* Header with View Controls */}
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
                
                {/* View Tabs: Day / Week / Month */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimelineView('day')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      timelineView === 'day'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setTimelineView('week')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      timelineView === 'week'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setTimelineView('month')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      timelineView === 'month'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Horizontal Timeline */}
              <div className="p-4 overflow-x-auto">
                <div className="flex items-start gap-6 min-w-max pb-4">
                  {/* Group activities by date */}
                  {getTimelineDates().map((date) => {
                    const dateActivities = plannerActivities.filter((a) => a.date === date);
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                    
                    return (
                      <div key={date} className="flex flex-col items-center min-w-[280px]">
                        {/* Date Header */}
                        <div className="text-center mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                          <p className="text-sm text-gray-500 dark:text-gray-400">{dayName}</p>
                          <p className="text-2xl dark:text-white">{dayNum}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{monthName}</p>
                        </div>

                        {/* Activities for this date */}
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
                                {/* Completion Indicator */}
                                {activity.completed && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}

                                {/* Time */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{activity.time}</span>
                                </div>

                                {/* Title */}
                                <h4 className="text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {activity.title}
                                </h4>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{activity.location}</span>
                                </div>

                                {/* Description */}
                                {activity.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                                    {activity.description}
                                  </p>
                                )}

                                {/* Arrow indicator for progression */}
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
                    {/* Modal Header */}
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

                    {/* Modal Body - Scrollable */}
                    <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                      {/* Activity Title */}
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

                      {/* Date and Time in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date Picker */}
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

                        {/* Simple Time Input as Alternative */}
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

                      {/* Interactive Clock Time Picker - Compact */}
                      <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30">
                        <ClockTimePicker
                          value={activityForm.time}
                          onChange={(time) => setActivityForm({ ...activityForm, time })}
                        />
                      </div>

                      {/* Interactive Location Picker */}
                      <div>
                        <label className="block text-sm mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location
                        </label>
                        <LocationPicker
                          value={activityForm.location}
                          onChange={(location) => setActivityForm({ ...activityForm, location })}
                        />
                      </div>

                      {/* Description */}
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

                    {/* Modal Footer */}
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

      {/* Message Input (only visible in chat tab) */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-300">
          <div className="max-w-4xl mx-auto">
            {/* Input Row */}
            <div className="flex items-center gap-3">
              {/* Media Button (Images & Videos) */}
              <button
                onClick={() => alert('Select image or video to send...')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Send Media"
              >
                <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              {/* Text Input */}
              <input
                type="text"
                placeholder="Aa"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-full outline-none focus:bg-gray-200 dark:focus:bg-gray-600 transition-colors"
              />
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                className="w-12 h-12 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600"
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Trip Planner Modal */}
      {showAIPlanner && (
      <AITripPlanner 
        onClose={() => setShowAIPlanner(false)}
        onAccept={(activities) => {
          console.log("Accepted:", activities);
        }}
        // --- SỬA ĐOẠN NÀY ---
        // 1. Lọc bỏ tin nhắn hệ thống (!m.isSystem)
        // 2. Chỉ lấy nội dung (m.content)
        // 3. Nối lại bằng dấu chấm câu ". " để model hiểu là các ý khác nhau
        chatContext={messages
          .filter(m => !m.isSystem) // Bỏ dòng "System: You joined..."
          .map(m => m.content)      // Chỉ lấy "Tôi muốn ăn cơm"
          .join('. ')               // Kết quả: "Tôi muốn ăn cơm. Đi xem phim."
        } 
      />
    )}
    </div>
  );
}