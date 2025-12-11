import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Navigation, Loader2, X, AlertCircle } from 'lucide-react';

// Khai báo global types cho window
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
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm thêm CSS VietMap nếu chưa có
  const injectVietMapCSS = () => {
    if (!document.querySelector('link[href*="vietmap-gl.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://maps.vietmap.vn/sdk/vietmap-gl/1.15.3/vietmap-gl.css';
      document.head.appendChild(link);
    }
  };

  // 1. KHỞI TẠO MAP
  useEffect(() => {
    let isMounted = true;
    injectVietMapCSS();

    const initMap = async () => {
      // Nếu map đã tồn tại, không init lại (Strict Mode safeguard)
      if (mapInstanceRef.current) return;

      if (!mapContainerRef.current) return;

      try {
        // A. Lấy Config từ Backend
        const res = await fetch('http://localhost:5000/map/api/config');
        if (!res.ok) throw new Error('Failed to load map config');
        const data = await res.json();
        const tileKey = data.tile_key;

        if (!tileKey) throw new Error('Missing VietMap Tile Key');

        // B. Đợi SDK Load (Polling an toàn)
        let attempts = 0;
        while (!window.vietmapgl && attempts < 20) {
          await new Promise(r => setTimeout(r, 200));
          attempts++;
        }

        if (!window.vietmapgl) {
          throw new Error('VietMap SDK not found. Please check index.html');
        }

        if (!isMounted) return;

        // C. Khởi tạo Map
        window.vietmapgl.accessToken = tileKey;
        const map = new window.vietmapgl.Map({
          container: mapContainerRef.current,
          style: `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${tileKey}`,
          center: [106.660172, 10.762622], // HCM
          zoom: 13,
          pitch: 0,
          bearing: 0,
        });

        map.addControl(new window.vietmapgl.NavigationControl(), 'bottom-right');
        map.addControl(new window.vietmapgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
        }), 'bottom-right');

        // D. Lắng nghe sự kiện load và error
        map.on('load', () => {
          if (isMounted) setIsMapReady(true);
        });

        // Bắt lỗi tile (403 Forbidden hoặc Invalid Key)
        map.on('error', (e: any) => {
          console.error("VietMap Runtime Error:", e);
          if (e?.error?.message?.includes('Unable to parse') || e?.error?.status === 403) {
            if (isMounted) {
               // FIX: Use a more specific error message based on the status code if available,
               // otherwise, rely on the general configuration warning.
               const status = e?.error?.status;
               let errorMessage = "Lỗi cấu hình Key: Vui lòng kiểm tra VIETMAP_TILE_KEY.";
               
               if (status === 403) {
                   errorMessage = "Lỗi 403 Forbidden: Key bị từ chối. Kiểm tra Domain Whitelist hoặc Key Type.";
               } else if (e?.error?.message?.includes('Unable to parse')) {
                   errorMessage = "Lỗi parse tile: Key không hợp lệ hoặc không có quyền truy cập.";
               }

               setError(errorMessage);
            }
          }
        });

        mapInstanceRef.current = map;

      } catch (err: any) {
        if (isMounted) setError(err.message);
        console.error("Map Init Error:", err);
      }
    };

    initMap();

    // CLEANUP FUNCTION (CRITICAL FIX FOR REACT STRICT MODE)
    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null; // Quan trọng: Reset ref về null để lần mount sau init lại được
      }
    };
  }, []);

  // 2. XỬ LÝ TÌM KIẾM
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:5000/map/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // 3. XỬ LÝ CHỌN ĐỊA ĐIỂM
  const handleSelectLocation = async (item: SearchResult) => {
    setSearchQuery(item.display);
    setSearchResults([]); // Ẩn dropdown
    
    try {
      const res = await fetch(`http://localhost:5000/map/api/detail?ref_id=${item.ref_id}`);
      const data = await res.json();
      
      if (data.lat && data.lng && mapInstanceRef.current) {
        const { lat, lng } = data;

        // Di chuyển map
        mapInstanceRef.current.flyTo({
          center: [lng, lat],
          zoom: 15,
          speed: 1.5
        });

        // Xóa marker cũ nếu có
        if (markerRef.current) markerRef.current.remove();

        // Tạo marker mới
        const el = document.createElement('div');
        el.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg animate-bounce flex items-center justify-center';
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

        markerRef.current = new window.vietmapgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(mapInstanceRef.current);

        // Tạo popup
        const popup = new window.vietmapgl.Popup({ offset: 25 })
            .setText(item.name);
        
        markerRef.current.setPopup(popup).togglePopup();
      }
    } catch (err) {
      console.error("Detail error:", err);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="relative w-full h-full bg-gray-100 flex flex-col overflow-hidden">
      
      {/* ERROR OVERLAY */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* SEARCH BAR WIDGET */}
      <div className="absolute top-4 left-4 right-4 md:left-4 md:w-96 z-10">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center px-4 py-3 gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm địa điểm (VD: Bitexco, Hoan Kiem)..."
              className="flex-1 outline-none text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : searchQuery ? (
              <button onClick={handleClearSearch}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            ) : null}
          </div>

          {/* SEARCH RESULTS DROPDOWN */}
          {searchResults.length > 0 && (
            <div className="border-t border-gray-100 max-h-80 overflow-y-auto rounded-b-lg bg-white">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{result.display}</p>
                    <p className="text-xs text-gray-500 truncate">{result.address}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="flex-1 relative w-full h-full bg-gray-200">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* LOADING OVERLAY */}
        {!isMapReady && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-sm z-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-600 font-medium animate-pulse">Đang tải bản đồ...</p>
          </div>
        )}
      </div>
    </div>
  );
}