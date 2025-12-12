import { useState, useEffect } from 'react';
import { 
  X, Sparkles, Check, Edit2, RefreshCw, Clock, MapPin, 
  DollarSign, Users, Send, ThumbsUp, ThumbsDown, 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2,
  Bug, Calendar, AlertTriangle // Added Icons
} from 'lucide-react';

interface Activity {
  id: number;
  time: string; // Keep for display if needed, or replace usage
  title: string;
  location: string;
  duration: string;
  cost: string;
  description: string;
  category: 'food' | 'attraction' | 'transport' | 'accommodation';
  lat: number; 
  lng: number;
  
  // NEW FIELDS for Date/Time & Weather
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  weatherRisk?: {
    code: string;
    description: string;
  } | null;
  isWeatherLoading?: boolean;
}

interface Props {
  onClose: () => void;
  onAccept: (activities: Activity[]) => void;
  chatContext: string;
}

// --- DESIGN SYSTEM ---
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

// --- WEATHER HELPER (Copied logic from Weather.tsx) ---
const getRiskImpact = (riskCode: string): string => {
  switch (riskCode) {
    case 'RISK_HEAVY_RAIN':
      return 'Bắt buộc chuyển hoạt động trong nhà.';
    case 'WARNING_LIGHT_RAIN':
      return 'Cảnh báo mang ô/áo mưa (Mưa 0.5mm - 2.0mm).';
    case 'RISK_EXTREME_HEAT':
      return 'Tránh hoạt động ngoài trời 10h sáng - 16h chiều (> 35°C).';
    case 'RISK_EXTREME_COLD':
      return 'Gợi ý giữ ấm, ưu tiên hoạt động ấm cúng (< 10°C).';
    case 'WARNING_CHILLY':
      return 'Cảnh báo cần thêm áo khoác (10°C - 15°C).';
    case 'RISK_HIGH_WIND':
      return 'Hạn chế hoạt động trên cao/trên biển (> 30km/h).';
    case 'NORMAL':
      return 'Thời tiết lý tưởng, không có rủi ro lớn.';
    default:
      return 'Thông tin rủi ro không xác định.';
  }
};

export function AITripPlanner({ onClose, onAccept, chatContext }: Props) {
  // --- STATE LOGIC ---
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false); 
  
  // --- STATE UI ---
  const [highlightedActivity, setHighlightedActivity] = useState<Activity | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIInput, setShowAIInput] = useState(true);

  // --- DEBUGGER ---
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // --- HÀM 1: GỌI AI SERVER (PORT 8000) ---
  const callAIServer = async (message: string) => {
    setIsProcessing(true);
    setSelectedActivities([]); 
    setHighlightedActivity(null); 
    addLog(`📤 Sending to Port 8000: "${message.substring(0, 30)}..."`);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) {
         throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      addLog(`📥 Received: ${data.data?.length || 0} items`);

      if (data.status === 'success') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDateStr = tomorrow.toISOString().split('T')[0];

        // LOGIC CHÍNH: Backend (ai_engine.py) trả về TẤT CẢ các gợi ý (tối đa 10) trong mảng data.data
        const newActivities: Activity[] = data.data.map((item: any, index: number) => ({
          id: Date.now() + index,
          time: 'TBD',
          title: item.name || item.step_intent,
          location: item.address || 'Vietnam',
          lat: item.lat || 0, 
          lng: item.lng || 0,
          duration: '1-2h',
          cost: 'Varies',
          description: `AI Suggestion: ${item.step_intent}`,
          category: mapIntentToCategory(item.step_intent),
          // Defaults
          startDate: defaultDateStr,
          startTime: '09:00',
          endTime: '11:00',
          weatherRisk: null,
          isWeatherLoading: false
        }));
        
        setActivities(newActivities);
        // [CHỈNH SỬA] Thay đổi từ tự động chọn thành KHÔNG CHỌN BẤT KỲ GỢI Ý NÀO
        setSelectedActivities([]); 
        
        // Auto-fetch weather for all new items
        newActivities.forEach(act => fetchWeatherForActivity(act));
      }
    } catch (error) {
      addLog(`🔥 Connection Failed: ${String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HÀM 2: GỌI WEATHER SERVER (PORT 5000) ---
  const fetchWeatherForActivity = async (activity: Activity) => {
    // Only fetch if we have valid coords and date
    if (!activity.lat || !activity.lng || !activity.startDate) return;

    // Update loading state
    setActivities(prev => prev.map(a => 
      a.id === activity.id ? { ...a, isWeatherLoading: true } : a
    ));

    try {
      addLog(`Checking weather for ${activity.title} on ${activity.startDate}...`);
      
      // We only need the date for daily forecast, time doesn't affect it.
      const response = await fetch(
        `http://localhost:5000/api/weather/forecast?lat=${activity.lat}&lon=${activity.lng}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // data.five_day_forecast is array of DailyForecastItem
      // Find match for startDate
      const match = data.five_day_forecast?.find((d: any) => d.date === activity.startDate);
      
      if (match) {
        // Check risks. The risk array contains codes like ["RISK_HEAVY_RAIN", "WARNING_CHILLY"]
        const risks = match.risks || [];
        
        // Find the most severe risk (or the first non-NORMAL risk)
        const severeRisk = risks.find((r: string) => r !== 'NORMAL') || null;

        setActivities(prev => prev.map(a => 
          a.id === activity.id ? {
            ...a,
            weatherRisk: severeRisk ? {
              code: severeRisk,
              description: getRiskImpact(severeRisk)
            } : null,
            isWeatherLoading: false
          } : a
        ));
        addLog(`Weather success for ${activity.title}. Risk: ${severeRisk || 'NORMAL'}`);
      } else {
         // No forecast data for this date (too far in future?)
         setActivities(prev => prev.map(a => a.id === activity.id ? { 
           ...a, 
           isWeatherLoading: false, 
           weatherRisk: { code: 'WARNING_NO_FORECAST', description: 'Không có dự báo thời tiết cho ngày này (quá xa).' }
         } : a));
         addLog(`Weather failed for ${activity.title}: No forecast found.`);
      }
    } catch (error) {
      console.error("Weather fetch error", error);
      addLog(`🔥 Weather Fetch Error: ${String(error)}`);
      setActivities(prev => prev.map(a => a.id === activity.id ? { 
        ...a, 
        isWeatherLoading: false, 
        weatherRisk: { code: 'ERROR_API_FETCH', description: 'Lỗi kết nối với máy chủ thời tiết.' }
      } : a));
    }
  };

  const updateActivityTime = (id: number, field: 'startDate' | 'startTime' | 'endTime', value: string) => {
    // 1. Cập nhật state
    setActivities(prev => {
        const updated = prev.map(a => {
            if (a.id === id) {
                return { ...a, [field]: value };
            }
            return a;
        });
        return updated;
    });

    // 2. Kích hoạt fetch thời tiết nếu startDate thay đổi và có tọa độ
    if (field === 'startDate') {
        const activityToUpdate = activities.find(a => a.id === id);
        if (activityToUpdate && activityToUpdate.lat && activityToUpdate.lng) {
            // Lấy hoạt động MỚI NHẤT từ state (giả lập)
            const newActivityData = { 
                ...activityToUpdate, 
                startDate: value, // Gán giá trị mới để hàm fetch sử dụng
                weatherRisk: null,
                isWeatherLoading: true 
            };
            
            // Dùng setTimeout nhỏ để đảm bảo React đã xử lý xong state update (thường không cần nhưng an toàn hơn)
            // và gọi hàm fetch
            setTimeout(() => {
                fetchWeatherForActivity(newActivityData);
            }, 50);
        }
    }
  };

  const mapIntentToCategory = (intent: string): Activity['category'] => {
    const i = intent.toLowerCase();
    if (i.includes('eat') || i.includes('food') || i.includes('dinner') || i.includes('lunch') || i.includes('coffee') || i.includes('ăn') || i.includes('cơm')) return 'food';
    if (i.includes('car') || i.includes('taxi') || i.includes('bus') || i.includes('ride') || i.includes('xe')) return 'transport';
    if (i.includes('hotel') || i.includes('stay') || i.includes('resort') || i.includes('nghỉ')) return 'accommodation';
    return 'attraction';
  };
  
  const toggleActivitySelection = (activity: Activity) => {
    setHighlightedActivity(activity);
    setSelectedActivities(prev => {
      if (prev.includes(activity.id)) {
        return prev.filter(id => id !== activity.id);
      } else {
        return [...prev, activity.id];
      }
    });
  };

  const handleSendPrompt = () => {
    if (!aiPrompt.trim()) return;
    callAIServer(aiPrompt);
    setAiPrompt('');
  };

  const handleAcceptAll = () => {
    const activitiesToAccept = activities.filter(a => selectedActivities.includes(a.id));
    onAccept(activitiesToAccept);
    onClose();
  };
  
  const scrollTimeline = (direction: 'left' | 'right') => {
    const container = document.getElementById('timeline-scroll');
    if (container) {
      const scroll = 400;
      container.scrollBy({ left: direction === 'left' ? -scroll : scroll, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] flex items-center justify-center p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden transition-colors duration-300 relative">
        
        {/* DEBUG PANEL */}
        {showDebug && (
          <div className="absolute top-0 right-0 w-80 h-full bg-black/90 text-green-400 p-4 font-mono text-xs overflow-y-auto z-50 border-l border-gray-700">
             <div className="flex justify-between border-b border-gray-700 pb-2 mb-2"><strong>AI LOGS (Port 8000)</strong><button onClick={() => setLogs([])}>Clear</button></div>
             {logs.map((log, i) => <div key={i} className="mb-1 border-b border-gray-800 pb-1">{log}</div>)}
          </div>
        )}

        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl">AI Trip Planner</h2>
                <p className="text-xs opacity-90">Ready for your request</p>
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
              <p className="text-base">~{activities.length * 2} hours</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center gap-1.5 mb-0.5"><MapPin className="w-3.5 h-3.5" /> <span className="text-xs opacity-80">Activities</span></div>
              <p className="text-base">{selectedActivities.length} / {activities.length} selected</p>
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
          {activities.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                    <p className="animate-pulse">Asking AI Server...</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                    <p>Enter a prompt below to plan your trip!</p>
                  </>
                )}
             </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                {/* HIỂN THỊ TỔNG SỐ GỢI Ý */}
                <h3 className="text-base dark:text-white font-semibold">Suggested Itinerary ({activities.length} items found)</h3>
                <div className="flex gap-2">
                  <button onClick={() => scrollTimeline('left')} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"><ChevronLeft className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => scrollTimeline('right')} className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"><ChevronRight className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>

              {/* CONTAINER HIỂN THỊ TẤT CẢ GỢI Ý (Cuộn ngang) */}
              <div id="timeline-scroll" className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                {activities.map((activity, index) => {
                  const isSelected = selectedActivities.includes(activity.id);
                  const isHighlighted = highlightedActivity?.id === activity.id;

                  return (
                    // Mỗi thẻ có chiều rộng cố định 80 (w-80), buộc phải cuộn nếu số lượng lớn
                    <div key={activity.id} className="flex-shrink-0 w-80 relative group">
                      {/* CARD */}
                      <div 
                        className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 ${
                          isSelected 
                            ? 'border-green-500 ring-4 ring-green-200 dark:ring-green-900/50' 
                            : (isHighlighted ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 dark:border-gray-700')
                        } z-10 flex flex-col h-full`}
                        onClick={(e) => {
                           // Prevent toggling when clicking inputs
                           if ((e.target as HTMLElement).tagName !== 'INPUT') {
                               toggleActivitySelection(activity);
                           }
                        }}
                      >
                        {/* HEADER with Category & Selection */}
                        <div className={`${categoryColors[activity.category]} px-3 py-2 rounded-t-xl text-white text-sm flex items-center justify-between font-medium cursor-pointer`}
                             onClick={() => toggleActivitySelection(activity)}
                        >
                          <span className="flex items-center gap-1">{categoryEmoji[activity.category]} {activity.category.toUpperCase()}</span>
                          {isSelected ? <Check className="w-5 h-5 bg-white/20 rounded-full p-1" /> : <div className="w-5 h-5 rounded-full border-2 border-white/50" />}
                        </div>

                        {/* CONTENT */}
                        <div className="p-4 flex-1 flex flex-col gap-3">
                          <h4 className="text-lg font-bold dark:text-white truncate" title={activity.title}>{activity.title}</h4>
                          
                          {/* Location */}
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" /> 
                              <span className="truncate">{activity.location}</span>
                          </div>

                          {/* TIME & DATE PICKERS */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg space-y-2 border border-gray-100 dark:border-gray-700">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <input 
                                  type="date" 
                                  className="flex-1 bg-transparent text-sm border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none dark:text-white"
                                  value={activity.startDate}
                                  onChange={(e) => updateActivityTime(activity.id, 'startDate', e.target.value)}
                                />
                             </div>
                             <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <div className="flex items-center gap-1 flex-1">
                                  <input 
                                    type="time" 
                                    className="w-full bg-transparent text-sm border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none dark:text-white"
                                    value={activity.startTime}
                                    onChange={(e) => updateActivityTime(activity.id, 'startTime', e.target.value)}
                                  />
                                  <span className="text-gray-400">-</span>
                                  <input 
                                    type="time" 
                                    className="w-full bg-transparent text-sm border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none dark:text-white"
                                    value={activity.endTime}
                                    onChange={(e) => updateActivityTime(activity.id, 'endTime', e.target.value)}
                                  />
                                </div>
                             </div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{activity.description}</p>
                          
                          {/* WEATHER WARNING UI */}
                          {activity.isWeatherLoading ? (
                             <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                               <Loader2 className="w-3 h-3 animate-spin" /> Checking weather...
                             </div>
                          ) : activity.weatherRisk && activity.weatherRisk.code === 'WARNING_NO_FORECAST' ? (
                             <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                   <div className="p-1 bg-yellow-100 dark:bg-yellow-800 rounded">
                                      <AlertTriangle className="w-3 h-3 text-yellow-600 dark:text-yellow-300" />
                                   </div>
                                   <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                                      {activity.weatherRisk.code.replace(/_/g, ' ')}
                                   </p>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
                                   {activity.weatherRisk.description}
                                </p>
                             </div>
                          ) : activity.weatherRisk ? (
                             <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                                <div className="flex items-center gap-2 mb-1">
                                   <div className="p-1 bg-red-100 dark:bg-red-800 rounded">
                                      <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-300" />
                                   </div>
                                   <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                      {activity.weatherRisk.code.replace(/_/g, ' ')}
                                   </p>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-1">
                                   {activity.weatherRisk.description}
                                </p>
                             </div>
                          ) : (
                             // Optional: Show "Good Weather" indicator
                             <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400 opacity-60">
                                <Check className="w-3 h-3" /> Weather looks good
                             </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  placeholder="Ask AI: 'Eat pho in Hanoi', 'Go to Ben Thanh market'..."
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
                <button onClick={() => setAiPrompt("Find cheap food")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">💰 Cheap Food</button>
                <button onClick={() => setAiPrompt("Visit historical places")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">🏛️ History</button>
                <button onClick={() => setAiPrompt("Suggest coffee shops")} className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200">☕ Coffee</button>
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
            
            <button 
              onClick={handleAcceptAll} 
              disabled={selectedActivities.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" /> Accept {selectedActivities.length > 0 ? `(${selectedActivities.length})` : ''} & Add to Planner
            </button>
          </div>
        </div>

      </div>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}