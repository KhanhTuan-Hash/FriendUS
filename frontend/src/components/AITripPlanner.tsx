import { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, Edit2, RefreshCw, Clock, MapPin, 
  DollarSign, Users, Send, ThumbsUp, ThumbsDown, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Bug 
} from 'lucide-react';

interface Activity {
  id: number;
  time: string;
  title: string;
  location: string;
  duration: string;
  cost: string;
  description: string;
  category: 'food' | 'attraction' | 'transport' | 'accommodation';
}

interface Props {
  onClose: () => void;
  onAccept: (activities: Activity[]) => void;
  chatContext: string;
}

// --- DESIGN SYSTEM (Giữ nguyên màu sắc cũ) ---
const categoryColors = {
  food: 'bg-orange-500',
  attraction: 'bg-blue-500',
  transport: 'bg-green-500',
  accommodation: 'bg-purple-500'
};

const categoryEmoji = {
  food: '🍜',
  attraction: '🏛️',
  transport: '🚗',
  accommodation: '🏨'
};

export function AITripPlanner({ onClose, onAccept, chatContext }: Props) {
  // --- STATE LOGIC ---
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // --- STATE UI ---
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIInput, setShowAIInput] = useState(true);

  // --- DEBUGGER ---
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // --- HÀM 1: GỌI AI SERVER (Logic mới) ---
  const callAIServer = async (message: string) => {
    setIsProcessing(true);
    addLog(`📤 Gửi: "${message.substring(0, 30)}..."`);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) throw new Error(`Lỗi Server: ${response.status}`);
      const data = await response.json();
      addLog(`📥 Nhận: ${data.data?.length || 0} địa điểm`);

      if (data.status === 'success') {
        const newActivities: Activity[] = data.data.map((item: any, index: number) => ({
          id: Date.now() + index,
          time: 'TBD',
          title: item.name || item.step_intent,
          location: item.address || 'Vietnam',
          duration: '1-2h',
          cost: 'Varies',
          description: `Gợi ý AI: ${item.step_intent}`,
          category: mapIntentToCategory(item.step_intent),
        }));
        setActivities(newActivities);
        if(newActivities.length > 0) setSelectedActivity(newActivities[0]);
      }
    } catch (error) {
      addLog(`🔥 LỖI: ${String(error)}`);
      alert("Không kết nối được AI Server (Port 8000). Hãy chạy 'python api_server.py'");
    } finally {
      setIsProcessing(false);
    }
  };

  const mapIntentToCategory = (intent: string): Activity['category'] => {
    const i = intent.toLowerCase();
    if (i.includes('ăn') || i.includes('uống') || i.includes('phở') || i.includes('cafe')) return 'food';
    if (i.includes('xe') || i.includes('ga')) return 'transport';
    if (i.includes('khách sạn') || i.includes('nghỉ')) return 'accommodation';
    return 'attraction';
  };

  // --- USE EFFECT: TỰ ĐỘNG GỌI KHI MỞ ---
  useEffect(() => {
    const init = async () => {
      setIsInitialLoading(true);
      addLog("🚀 KHỞI ĐỘNG: Đọc tin nhắn...");
      const prompt = chatContext 
        ? `Dựa trên tin nhắn này: "${chatContext}". Hãy lên lịch trình.` 
        : "Gợi ý lịch trình tham quan trung tâm thành phố";
      await callAIServer(prompt);
      setIsInitialLoading(false);
    };
    init();
  }, [chatContext]);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN UI ---
  const handleSendPrompt = () => {
    if (!aiPrompt.trim()) return;
    callAIServer(aiPrompt);
    setAiPrompt('');
  };

  // 🔥 ĐÂY LÀ HÀM BẠN BỊ THIẾU DẪN ĐẾN LỖI ---
  const handleAcceptAll = () => {
    onAccept(activities);
    onClose();
  };
  // ------------------------------------------

  const scrollTimeline = (direction: 'left' | 'right') => {
    const container = document.getElementById('timeline-scroll');
    if (container) {
      const scroll = 400;
      container.scrollBy({ left: direction === 'left' ? -scroll : scroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[80vh] flex flex-col overflow-hidden transition-colors duration-300 relative">
        
        {/* DEBUG PANEL */}
        {showDebug && (
          <div className="absolute top-0 right-0 w-80 h-full bg-black/90 text-green-400 p-4 font-mono text-xs overflow-y-auto z-50 border-l border-gray-700">
             <div className="flex justify-between border-b border-gray-700 pb-2 mb-2"><strong>AI LOGS</strong><button onClick={() => setLogs([])}>Clear</button></div>
             {logs.map((log, i) => <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>)}
          </div>
        )}

        {/* HEADER (Design Gốc) */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl">AI Trip Planner</h2>
                <p className="text-xs opacity-90">Personalized itinerary for your group</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5"><Clock className="w-3.5 h-3.5" /> <span className="text-xs opacity-80">Duration</span></div>
              <p className="text-base">~5 hours</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5"><MapPin className="w-3.5 h-3.5" /> <span className="text-xs opacity-80">Activities</span></div>
              <p className="text-base">{activities.length} stops</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5"><DollarSign className="w-3.5 h-3.5" /> <span className="text-xs opacity-80">Est. Cost</span></div>
              <p className="text-base">Varies</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5"><Users className="w-3.5 h-3.5" /> <span className="text-xs opacity-80">Group Size</span></div>
              <p className="text-base">Your Group</p>
            </div>
          </div>
        </div>

        {/* TIMELINE BODY */}
        <div className="relative flex-1 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
          {isInitialLoading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-gray-500 animate-pulse font-medium">AI is reading your chat & planning...</p>
             </div>
          ) : activities.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                <p>No itinerary found. Try asking AI below!</p>
             </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base dark:text-white font-semibold">Suggested Itinerary</h3>
                <div className="flex gap-2">
                  <button onClick={() => scrollTimeline('left')} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => scrollTimeline('right')} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>

              <div id="timeline-scroll" className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex-shrink-0 w-72 relative group">
                    {index < activities.length - 1 && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-full w-4 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 z-0" />
                    )}
                    
                    <div 
                      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 ${
                        selectedActivity?.id === activity.id ? 'border-purple-500 ring-4 ring-purple-200' : 'border-transparent'
                      } z-10`}
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className={`${categoryColors[activity.category]} px-3 py-1 rounded-t-xl text-white text-sm flex items-center justify-between font-medium`}>
                        <span>{categoryEmoji[activity.category]} {activity.category.toUpperCase()}</span>
                        <span>{activity.time}</span>
                      </div>

                      <div className="p-4">
                        <h4 className="text-lg font-bold mb-2 dark:text-white truncate" title={activity.title}>{activity.title}</h4>
                        <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" /> <span className="truncate">{activity.location}</span></div>
                          <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0 text-orange-500" /> <span>{activity.duration}</span></div>
                          <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 flex-shrink-0 text-green-500" /> <span>{activity.cost}</span></div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">{activity.description}</p>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"><RefreshCw className="w-3 h-3" /> Regen</button>
                          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium"><Edit2 className="w-3 h-3" /> Edit</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* INPUT AREA */}
        {showAIInput && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-all duration-300">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                  placeholder="Ask AI: 'Add coffee spot', 'Cheaper places'..."
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-white"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendPrompt}
                  disabled={!aiPrompt.trim() || isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Send
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => callAIServer("Make it budget-friendly")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">💰 Budget-friendly</button>
                <button onClick={() => callAIServer("Add more food spots")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">🍜 More food</button>
                <button onClick={() => callAIServer("Focus on culture")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">🏛️ Culture</button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
           <div className="flex justify-between items-center px-4 pt-2">
             <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-gray-400 flex items-center gap-1 hover:text-purple-500"><Bug className="w-3 h-3"/> Debug</button>
             <button onClick={() => setShowAIInput(!showAIInput)} className="px-6 py-1 bg-gray-100 dark:bg-gray-700 rounded-b-lg text-xs text-gray-500 flex items-center gap-1 hover:bg-gray-200">
               {showAIInput ? <><ChevronDown className="w-3 h-3"/> Hide</> : <><ChevronUp className="w-3 h-3"/> Show AI</>}
             </button>
             <div className="w-10"></div>
          </div>

          <div className="p-4 flex gap-3 max-w-4xl mx-auto">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            
            {/* NÚT NÀY ĐÃ ĐƯỢC SỬA LỖI */}
            <button onClick={handleAcceptAll} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Accept & Add to Planner
            </button>
          </div>
        </div>

      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}