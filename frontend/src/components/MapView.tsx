import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, X, AlertCircle } from 'lucide-react';

// Khai báo để TypeScript không báo lỗi window
declare global {
  interface Window {
    vietmapgl: any;
  }
}

interface SearchResult {
  ref_id: string;
  address: string;
  name: string;
  display: string;
}

interface LocationDetail {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDetail | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- DEBUG STATES ---
  const [logs, setLogs] = useState<string[]>([]);
  const [hasCriticalError, setHasCriticalError] = useState(false);

  // Hàm ghi log ra màn hình
  const addLog = (msg: string, isError = false) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${isError ? '❌' : '✅'} ${msg}`]);
    console.log(`[MapView] ${msg}`);
    if (isError) setHasCriticalError(true);
  };

  // 1. QUY TRÌNH KHỞI TẠO (Diagnostic Mode)
  useEffect(() => {
    const initProcess = async () => {
      addLog("Bắt đầu khởi tạo MapView...");

      // BƯỚC 1: KIỂM TRA DOM
      if (!mapContainerRef.current) {
        addLog("Lỗi: Không tìm thấy thẻ div chứa bản đồ (mapContainerRef is null)", true);
        return;
      }
      addLog("DOM Container đã sẵn sàng.");

      // BƯỚC 2: GỌI BACKEND LẤY KEY
      let tileKey = "";
      try {
        addLog("Đang gọi API: http://localhost:5000/map/api/config ...");
        const res = await fetch('http://localhost:5000/map/api/config');
        
        if (res.status === 401 || res.status === 302 || res.url.includes('login')) {
             throw new Error("Lỗi Auth: API đang yêu cầu đăng nhập (302/401). Hãy kiểm tra lại file map.py đã xóa @login_required chưa.");
        }
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status} ${res.statusText}`);

        const data = await res.json();
        addLog(`Backend phản hồi: ${JSON.stringify(data)}`);

        if (!data.tile_key) throw new Error("Backend trả về tile_key rỗng. Kiểm tra file .env!");
        if (data.tile_key.includes("YOUR_REAL")) throw new Error("Bạn chưa thay key thật vào file .env!");
        
        tileKey = data.tile_key;
        addLog("Đã lấy được Tile Key hợp lệ.");

      } catch (e: any) {
        addLog(`Lỗi BƯỚC 2 (Backend): ${e.message}`, true);
        return;
      }

      // BƯỚC 3: KIỂM TRA SDK VIETMAP (window.vietmapgl)
      addLog("Đang kiểm tra thư viện VietMap GL SDK...");
      let retries = 50; // Thử trong 10 giây (50 * 200ms)
      while (!window.vietmapgl && retries > 0) {
        await new Promise(r => setTimeout(r, 200));
        retries--;
      }

      if (!window.vietmapgl) {
        addLog("Lỗi BƯỚC 3: Không tìm thấy window.vietmapgl. Bạn đã thêm <script> vào index.html chưa?", true);
        return;
      }
      addLog("Đã tìm thấy thư viện VietMap SDK.");

      // BƯỚC 4: VẼ BẢN ĐỒ
      try {
        addLog("Đang khởi tạo Map Instance...");
        if (mapInstanceRef.current) return; // Đã có map rồi

        window.vietmapgl.accessToken = tileKey;
        const map = new window.vietmapgl.Map({
          container: mapContainerRef.current,
          style: `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${tileKey}`,
          center: [106.660172, 10.762622], // TP.HCM
          zoom: 13,
          pitch: 0,
          bearing: 0,
        });

        // Event listeners để debug
        map.on('load', () => {
             addLog("Sự kiện Map 'load' đã kích hoạt -> THÀNH CÔNG!");
        });
        
        map.on('error', (e: any) => {
             addLog(`Sự kiện Map 'error': ${JSON.stringify(e)}`, true);
        });

        map.addControl(new window.vietmapgl.NavigationControl(), 'bottom-right');
        mapInstanceRef.current = map;
        addLog("Lệnh new Map() đã chạy xong.");

      } catch (e: any) {
        addLog(`Lỗi BƯỚC 4 (Render Map): ${e.message}`, true);
      }
    };

    initProcess();

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, []);

  // ... (Các hàm Search, FlyTo giữ nguyên như cũ, tôi lược bớt để tập trung debug lỗi hiển thị) ...
  // (Bạn có thể giữ lại logic search từ file cũ nếu cần, ở đây tôi ưu tiên hiển thị map trước)
  
  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-100 flex flex-col">
      
      {/* KHUNG HIỂN THỊ LOG DEBUG (XÓA SAU KHI FIX XONG) */}
      <div className="absolute top-4 left-4 z-50 bg-black/80 text-green-400 p-4 rounded-lg font-mono text-xs w-96 max-h-96 overflow-y-auto border border-green-500 shadow-2xl">
        <h3 className="font-bold border-b border-green-600 pb-2 mb-2 text-white flex justify-between">
           SYSTEM DIAGNOSTICS
           {hasCriticalError && <span className="text-red-500 animate-pulse">ERROR DETECTED</span>}
        </h3>
        <ul className="space-y-1">
            {logs.map((log, i) => (
                <li key={i} className={log.includes('❌') ? 'text-red-400 font-bold' : ''}>{log}</li>
            ))}
        </ul>
        {hasCriticalError && (
            <div className="mt-4 p-2 bg-red-900/50 text-white border border-red-500 rounded">
                <p>⚠️ Map không hiển thị do lỗi trên. Hãy chụp màn hình này và kiểm tra lại.</p>
            </div>
        )}
      </div>

      {/* MAP CONTAINER */}
      <div 
        ref={mapContainerRef} 
        className="flex-1 w-full h-full relative"
        style={{ minHeight: '500px' }} // Đảm bảo div có chiều cao
      >
         {/* Nếu map chưa load, hiện nền xám */}
         <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
            Waiting for Map Rendering...
         </div>
      </div>
    </div>
  );
}