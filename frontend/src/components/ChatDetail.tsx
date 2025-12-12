import { useState, useEffect } from 'react';
// FIX: Sửa lỗi không giải quyết được module bằng cách thêm đuôi .tsx vào đường dẫn import
import { AITripPlanner } from './AITripPlanner.tsx'; 
import {
  ArrowLeft, Send, DollarSign, Calendar, MessageSquare, TrendingUp, TrendingDown,
  Plus, Check, ArrowRight, Phone, Video, MoreVertical, Image as ImageIcon,
  LogOut, X, Clock, MapPin, Sparkles, Edit2
} from 'lucide-react';
import { 
  getChatFinance, addChatFinance, 
  getChatPlanner, addChatPlanner 
} from '../utils/chatDatabase';

// --- STUB COMPONENTS (Assuming these were missing or caused conflicts) ---
const ClockTimePicker = ({ value, onChange }: any) => (
  <input 
    type="time" 
    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
    value={value} 
    onChange={e => onChange(e.target.value)} 
  />
);
const LocationPicker = ({ value, onChange }: any) => (
  <div className="relative">
    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
    <input 
      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
      placeholder="Search location..." 
      value={value} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);
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
  // FIX 3: Thêm lat/lng để đồng bộ dữ liệu
  lat?: number;
  lng?: number;
}

const DUMMY_FINANCE: FinanceItem[] = [
  { id: 1, person: 'Linh', amount: 500000, description: 'Hotel booking (2 nights)', type: 'debt', settled: false },
  { id: 2, person: 'Minh', amount: 150000, description: 'Bus tickets', type: 'lend', settled: true },
  { id: 3, person: 'Tuan', amount: 200000, description: 'Dinner at local restaurant', type: 'debt', settled: false }
];

const DUMMY_ACTIVITIES: PlannerActivity[] = [
  // Thêm lat/lng giả định cho dữ liệu dummy để tránh lỗi type
  { id: 1, time: '8:00 AM', title: 'Meet at bus station', location: 'Ben Xe Mien Dong', completed: true, date: '2025-12-08', description: 'Departure to Hanoi', lat: 10.76, lng: 106.67 },
  { id: 3, time: '2:00 PM', title: 'Visit Hoan Kiem Lake', location: 'Old Quarter, Hanoi', completed: false, date: '2025-12-09', description: 'Walking tour around the lake', lat: 21.03, lng: 105.85 }
];

export function ChatDetail({ chat, onBack, messages, onSendMessage, handleLeaveChat }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'finance' | 'planner'>('chat');
  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [financeItems, setFinanceItems] = useState<any[]>([]);
  const [plannerActivities, setPlannerActivities] = useState<any[]>([]);

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
        const realFinance = getChatFinance(chat.id);
        setFinanceItems(realFinance);
    } else if (activeTab === 'planner') {
        const realPlanner = getChatPlanner(chat.id);
        setPlannerActivities(realPlanner);
    }
  }, [activeTab, chat.id]);

  const handleMockAddFinance = () => {
     const newItem = {
        id: Date.now(),
        person: 'You',
        amount: 100000,
        description: 'Shared cost (Test)',
        type: 'lend',
        settled: false
     };
     addChatFinance(chat.id, newItem);
     setFinanceItems(prev => [...prev, newItem]);
  };

  const handleAddActivity = () => {
    const activityDateTime = new Date(`${activityForm.date}T${activityForm.time}`);
    const currentDateTime = new Date();
    const isCompleted = activityDateTime < currentDateTime;
    
    const newActivity = {
      id: Date.now(), 
      time: activityForm.time,
      title: activityForm.title,
      location: activityForm.location,
      completed: isCompleted,
      date: activityForm.date,
      description: activityForm.description,
      lat: 0, 
      lng: 0 
    };
    // Save DB and Update UI
    addChatPlanner(chat.id, newActivity);
    setPlannerActivities(prev => [...prev, newActivity]);
    // Reset form
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

  // const totalDebt = financeItems
  //   .filter((item) => item.type === 'debt' && !item.settled)
  //   .reduce((sum, item) => sum + item.amount, 0);

  // const totalLend = financeItems
  //   .filter((item) => item.type === 'lend' && !item.settled)
  //   .reduce((sum, item) => sum + item.amount, 0);

  // // FIX 4: Sửa lỗi ngày cứng và gán lat/lng từ gợi ý AI
  // const handleAcceptAISuggestions = (aiActivities: any[]) => {
  //   const today = new Date().toISOString().substring(0, 10);
    
  //   const newActivities = aiActivities.map((ai, index) => ({
  //     id: Date.now() + index,
  //     time: ai.time,
  //     title: ai.title,
  //     location: ai.location,
  //     completed: false,
  //     date: today, // Sửa từ '2025-12-10' cứng sang ngày hiện tại
  //     description: ai.description,
  //     lat: ai.lat, // Lấy lat từ AITripPlanner
  //     lng: ai.lng, // Lấy lng từ AITripPlanner
  //   }));
  //   newActivities.forEach(act => addChatPlanner(chat.id, act));
  //   setPlannerActivities(prev => [...prev, ...newActivities]);

  //   const handleMockAddFinance = () => {
  //    const newItem = {
  //       id: Date.now(),
  //       person: 'You',
  //       amount: 100000,
  //       description: 'Test payment',
  //       type: 'lend',
  //       settled: false
  //    };
  //    addChatFinance(chat.id, newItem);
  //    setFinanceItems(prev => [...prev, newItem]);
  //   };
  // };
  const handleAcceptAISuggestions = (aiActivities: any[]) => {
    const today = new Date().toISOString().substring(0, 10);
    const newActivities = aiActivities.map((ai, index) => ({
      id: Date.now() + index,
      time: ai.time,
      title: ai.title,
      location: ai.location,
      completed: false,
      date: today,
      description: ai.description,
      lat: ai.lat,
      lng: ai.lng,
    }));
    newActivities.forEach(act => addChatPlanner(chat.id, act));
    setPlannerActivities(prev => [...prev, ...newActivities]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* --- HEADER --- */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm transition-colors duration-300 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 dark:text-gray-300" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xl shadow-sm">
              {chat.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold dark:text-white">{chat.name}</h2>
              {chat.participants && <p className="text-sm text-gray-500">{chat.participants.join(', ')}</p>}
            </div>
            
            {/* Header Actions */}
            <div className="flex gap-2">
                <button onClick={() => alert('Call')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Phone className="w-5 h-5 dark:text-gray-300"/></button>
                <button onClick={() => alert('Video')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><Video className="w-5 h-5 dark:text-gray-300"/></button>
                <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><MoreVertical className="w-5 h-5 dark:text-gray-300"/></button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl border dark:border-gray-700 rounded-lg z-50 overflow-hidden">
                            <button onClick={() => handleLeaveChat(chat.id)} className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 flex gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut className="w-4 h-4"/> Leave Chat</button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2">
            {['chat', 'finance', 'planner'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg capitalize font-medium transition-all ${
                        activeTab === tab 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                    {tab === 'chat' && <MessageSquare className="w-4 h-4"/>}
                    {tab === 'finance' && <DollarSign className="w-4 h-4"/>}
                    {tab === 'planner' && <Calendar className="w-4 h-4"/>}
                    <span>{tab}</span>
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          
          {/* 1. CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="space-y-4 pb-4">
              {/* Thêm safety check messages? để tránh crash */}
              {messages && messages.map((message) => (
                <div key={message.id || Math.random()} className={`flex ${message.isSystem ? 'justify-center' : message.isMe ? 'justify-end' : 'justify-start'}`}>
                  {message.isSystem ? (
                    <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium uppercase tracking-wide">
                      {message.content}
                    </div>
                  ) : (
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                        message.isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                    }`}>
                      {!message.isMe && <p className="text-xs font-bold mb-1 opacity-70">{message.sender}</p>}
                      <p className="leading-relaxed">{message.content}</p>
                      <p className={`text-[10px] mt-1 text-right ${message.isMe ? 'text-blue-100' : 'text-gray-400'}`}>{message.time}</p>
                    </div>
                  )}
                </div>
              ))}
              <div id="scroll-anchor"></div>
            </div>
          )}

          {/* 2. FINANCE TAB */}
          {activeTab === 'finance' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               {/* Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <h3 className="text-red-800 dark:text-red-300 font-medium">You Owe</h3>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">0 ₫</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-green-800 dark:text-green-300 font-medium">You Are Owed</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">0 ₫</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold dark:text-white">Transactions</h3>
                  <button onClick={handleMockAddFinance} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add Test
                  </button>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {financeItems.length > 0 ? (
                    financeItems.map((item) => (
                      <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             item.type === 'debt' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                         }`}>
                             {item.type === 'debt' ? <TrendingDown size={18}/> : <TrendingUp size={18}/>}
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.person} • {new Date(item.id).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                            <p className={`font-bold ${item.type === 'debt' ? 'text-red-600' : 'text-green-600'}`}>
                                {item.amount?.toLocaleString()} ₫
                            </p>
                            {!item.settled && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Pending</span>}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                        <p>No transactions recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. PLANNER TAB - (ĐÃ KHÔI PHỤC UI ĐẸP) */}
          {activeTab === 'planner' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
               {/* Header Planner */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">Trip Itinerary</h3>
                    <p className="text-xs text-gray-500">Plan your journey together</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAIPlanner(true)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105">
                        <Sparkles className="w-4 h-4" /> AI Suggest
                    </button>
                    <button onClick={() => setShowAddActivity(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4" /> Add Activity
                    </button>
                  </div>
              </div>

              {/* List Activities (Beautiful UI Restored) */}
              <div className="p-4 overflow-x-auto">
                <div className="flex items-start gap-6 min-w-max pb-4">
                  {getTimelineDates().length > 0 ? getTimelineDates().map((date) => {
                    const dateActivities = plannerActivities.filter((a) => a.date === date);
                    const dateObj = new Date(date);
                    
                    return (
                      <div key={date} className="flex flex-col items-center min-w-[300px]">
                        {/* Date Header Sticky */}
                        <div className="text-center mb-6 sticky top-0 z-10">
                          <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-2">
                             <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{dateObj.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                             <p className="text-2xl font-black dark:text-white">{dateObj.getDate()}</p>
                             <p className="text-xs text-gray-400 font-medium">{dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>

                        {/* Activities List */}
                        <div className="w-full space-y-4 px-2">
                          {dateActivities.map((activity) => (
                              <div 
                                key={activity.id} 
                                className={`relative group bg-gradient-to-br ${
                                    activity.completed 
                                    ? 'from-green-50 to-emerald-50 border-green-200 dark:from-green-900/10 dark:to-emerald-900/10 dark:border-green-800' 
                                    : 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/10 dark:to-indigo-900/10 dark:border-blue-800'
                                } border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                              >
                                {activity.completed && (
                                  <div className="absolute -top-3 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-md border-2 border-white dark:border-gray-900">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}

                                <div className="flex items-center gap-2 mb-3">
                                  <div className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-lg shadow-sm">
                                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-mono">{activity.time}</span>
                                </div>

                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                    {activity.title}
                                </h4>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                                  <MapPin className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{activity.location || "No location set"}</span>
                                </div>

                                {activity.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200/50 dark:border-gray-700/50 pt-3 mt-1 line-clamp-2 italic">
                                    "{activity.description}"
                                  </p>
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                    );
                  }) : (
                     <div className="w-full text-center py-12 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 opacity-50"/>
                        </div>
                        <p className="font-medium">No plans yet for this trip.</p>
                        <p className="text-sm opacity-70 mt-1">Click "Add Activity" or use AI to start.</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- FOOTER (INPUT) --- */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-20">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
             <button className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><ImageIcon className="w-5 h-5"/></button>
             <div className="flex-1 relative">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                    className="w-full pl-5 pr-12 py-3 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || isSending} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md"
                >
                    <Send className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {showAIPlanner && <AITripPlanner onClose={() => setShowAIPlanner(false)} onAccept={handleAcceptAISuggestions} chatContext="" />}
      
      {showAddActivity && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-0 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><Calendar className="w-5 h-5"/></div>
                        <div>
                            <h3 className="text-lg font-bold">New Activity</h3>
                            <p className="text-xs text-blue-100">Add details to your itinerary</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAddActivity(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex gap-2"><Edit2 className="w-4 h-4"/> Activity Title</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dinner at 4P's Pizza" value={activityForm.title} onChange={e => setActivityForm({...activityForm, title: e.target.value})} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                            <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={activityForm.date} onChange={e => setActivityForm({...activityForm, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time</label>
                            <ClockTimePicker value={activityForm.time} onChange={(val: string) => setActivityForm({...activityForm, time: val})} />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                         <LocationPicker value={activityForm.location} onChange={(val: string) => setActivityForm({...activityForm, location: val})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                        <textarea rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Ticket prices, reservation code, etc." value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})} />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <button onClick={() => setShowAddActivity(false)} className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleAddActivity} className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">Save Activity</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}