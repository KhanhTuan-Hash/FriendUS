import { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Search,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Navigation
} from 'lucide-react';

// =========================================================================
// 1. INTERFACES & TYPES
// =========================================================================

interface DailyForecastItem {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_sum: number;
  wind_max_kmh: number;
  weather_desc: string;
  risks: string[];
}

interface CurrentWeather {
  temperature: number;
  temp_max: number;
  temp_min: number;
  weather_desc: string;
  daily_risks: string[];
  precipitation_sum: number;
  wind_max_kmh: number;
}

interface WeatherData {
  current_weather: CurrentWeather | null;
  five_day_forecast: DailyForecastItem[];
}

interface CityCoordinate {
  id?: number;
  name: string;
  region: string;
  lat: number;
  lon: number;
  currentPreview?: CurrentWeather | null;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

// =========================================================================
// 2. HELPER FUNCTIONS
// =========================================================================

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

const WeatherIcon = ({ iconDesc, className = "w-12 h-12" }: { iconDesc: string; className?: string }) => {
  const desc = iconDesc ? iconDesc.toLowerCase() : '';
  
  if (desc.includes('mưa') || desc.includes('rain') || desc.includes('drizzle')) {
    return <CloudRain className={`${className} text-blue-500`} />;
  }
  if (desc.includes('quang') || desc.includes('nắng') || desc.includes('sunny') || desc.includes('clear')) {
    return <Sun className={`${className} text-yellow-500`} />;
  }
  if (desc.includes('tuyết') || desc.includes('snow')) {
    return <CloudRain className={`${className} text-cyan-300`} />;
  }
  if (desc.includes('bão') || desc.includes('thunder') || desc.includes('dông')) {
    return <Wind className={`${className} text-purple-500`} />;
  }
  if (desc.includes('sương')) {
    return <Cloud className={`${className} text-gray-300`} />;
  }
  return <Cloud className={`${className} text-gray-400`} />;
};

// =========================================================================
// 3. MAIN COMPONENT
// =========================================================================

export function Weather() {
  const [defaultCities, setDefaultCities] = useState<CityCoordinate[]>([
    { name: 'Hanoi', region: 'Vietnam', lat: 21.0285, lon: 105.8542, currentPreview: null },
    { name: 'Ho Chi Minh City', region: 'Vietnam', lat: 10.77, lon: 106.69, currentPreview: null },
    { name: 'Da Nang', region: 'Vietnam', lat: 16.0544, lon: 108.2022, currentPreview: null },
  ]);

  const [selectedCity, setSelectedCity] = useState<CityCoordinate>(defaultCities[0]);
  const [detailedWeather, setDetailedWeather] = useState<WeatherData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  // A. Fetch dữ liệu tóm tắt cho 3 thẻ mặc định
  useEffect(() => {
    const fetchDefaultCities = async () => {
      setIsLoadingDefaults(true);
      
      // FIX: Use sequential fetching instead of Promise.all to avoid 
      // overloading the single-threaded Flask dev server, which caused
      // the tab data to fail (returning null) in the previous version.
      const newCities = [...defaultCities];
      
      for (let i = 0; i < newCities.length; i++) {
        const city = newCities[i];
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(
            `http://localhost:5000/api/weather/forecast?lat=${city.lat}&lon=${city.lon}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (response.ok) {
            const data: WeatherData = await response.json();
            newCities[i] = { ...city, currentPreview: data.current_weather };
            // Update state incrementally to show progress if desired
            setDefaultCities([...newCities]);
          }
        } catch (error) {
          console.error(`Lỗi tải data cho ${city.name}:`, error);
        }
      }
      
      setIsLoadingDefaults(false);
    };

    fetchDefaultCities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // B. Fetch dữ liệu chi tiết khi selectedCity thay đổi
  useEffect(() => {
    const fetchDetailedWeather = async () => {
      setIsLoadingDetail(true);
      try {
        const response = await fetch(`http://localhost:5000/api/weather/forecast?lat=${selectedCity.lat}&lon=${selectedCity.lon}`);
        if (!response.ok) throw new Error('API Error');
        const data: WeatherData = await response.json();
        setDetailedWeather(data);
      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
        setDetailedWeather(null);
      } finally {
        setIsLoadingDetail(false);
      }
    };

    fetchDetailedWeather();
  }, [selectedCity]);

  // C. Xử lý tìm kiếm địa điểm (Geocoding API)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=en&format=json`);
        const data = await response.json();
        if (data.results) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectSearchResult = (result: GeocodingResult) => {
    const newCity: CityCoordinate = {
      name: result.name,
      region: `${result.admin1 || ''}, ${result.country}`.replace(/^, /, ''),
      lat: result.latitude,
      lon: result.longitude,
      currentPreview: null 
    };
    setSelectedCity(newCity);
    setSearchQuery(''); 
    setSearchResults([]); 
  };

  const current = detailedWeather?.current_weather;

  if (isLoadingDetail && !detailedWeather) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Đang cập nhật thời tiết...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      
      {/* 1. SEARCH BAR */}
      <div className="mb-8 relative z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-blue-500/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm bất kỳ (VD: Dalat, Tokyo, London...)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent dark:text-white placeholder-gray-400"
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{result.name}</p>
                  <p className="text-xs text-gray-500">{result.admin1 ? `${result.admin1}, ` : ''}{result.country}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. DEFAULT CITIES TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {defaultCities.map((city, index) => (
          <button
            key={index}
            onClick={() => setSelectedCity(city)}
            className={`relative overflow-hidden group bg-white dark:bg-gray-800 rounded-2xl p-5 text-left transition-all duration-300 border ${
              selectedCity.name === city.name
                ? 'border-blue-500 shadow-lg ring-1 ring-blue-500 bg-blue-50/10'
                : 'border-transparent shadow-sm hover:shadow-md hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg dark:text-white group-hover:text-blue-600 transition-colors">
                  {city.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{city.region}</p>
              </div>
              
              {/* FIX: Ensure WeatherIcon component is reliably rendered when data is available. 
                  Added check for `weather_desc` to prevent rendering a blank icon if the 
                  description is unexpectedly null/empty, falling back to the cloud placeholder. */}
              {city.currentPreview && city.currentPreview.weather_desc ? (
                 <WeatherIcon iconDesc={city.currentPreview.weather_desc} className="w-10 h-10" />
              ) : (
                 <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full flex items-center justify-center">
                    {/* Fallback to Cloud icon if data is missing or loading is slow */}
                    {isLoadingDefaults ? '' : <Cloud className="w-6 h-6 text-gray-400" />}
                 </div>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                 {city.currentPreview?.temperature !== undefined ? (
                    <p className="text-3xl font-light dark:text-white">
                      {city.currentPreview.temperature}°C
                    </p>
                 ) : (
                    <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-1"></div>
                 )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-right max-w-[50%] truncate">
                {city.currentPreview?.weather_desc ?? ''}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. MAIN WEATHER CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100 text-sm uppercase tracking-wider">{selectedCity.region}</span>
                </div>
                <h2 className="4xl font-bold">{selectedCity.name}</h2>
                <p className="text-blue-100 mt-2">Cập nhật lúc: {new Date().toLocaleTimeString()}</p>
              </div>
              <WeatherIcon iconDesc={current?.weather_desc || ''} className="w-24 h-24 text-white drop-shadow-lg" />
            </div>

            <div className="flex flex-col md:flex-row items-end gap-6 mb-8 border-b border-white/20 pb-8">
              <span className="text-8xl font-thin tracking-tighter">
                {current?.temperature ?? '--'}°C
              </span>
              <div className="flex flex-col gap-1 mb-4">
                <p className="text-2xl font-medium">{current?.weather_desc}</p>
                <div className="flex gap-4 text-blue-100 text-sm">
                  <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Cao: {current?.temp_max}°</span>
                  <span className="flex items-center gap-1"><TrendingDown className="w-4 h-4" /> Thấp: {current?.temp_min}°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm">
                  <Droplets className="w-4 h-4" /> Lượng mưa
                </div>
                <p className="text-xl font-semibold">{current?.precipitation_sum.toFixed(1) ?? 0} mm</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm">
                  <Wind className="w-4 h-4" /> Gió Max
                </div>
                <p className="text-xl font-semibold">{current?.wind_max_kmh ?? 0} km/h</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm">
                  <Eye className="w-4 h-4" /> Tầm nhìn
                </div>
                <p className="text-xl font-semibold">10+ km</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-200 text-sm">
                  <Gauge className="w-4 h-4" /> Áp suất
                </div>
                <p className="text-xl font-semibold">1012 hPa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Warnings */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Cảnh báo & Lời khuyên</h3>
            </div>
            
            <div className="space-y-3">
              {current?.daily_risks && current.daily_risks.length > 0 && current.daily_risks[0] !== 'NORMAL' ? (
                current.daily_risks.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30">
                     <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                       {risk.replace(/_/g, ' ')}
                     </p>
                     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                       {getRiskImpact(risk)}
                     </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30 text-center">
                  <p className="font-medium text-green-700 dark:text-green-400">Thời tiết an toàn</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lý tưởng cho các hoạt động ngoài trời.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 5-DAY FORECAST */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <Sun className="w-5 h-5" /> Dự báo 5 ngày tới
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {detailedWeather?.five_day_forecast.map((day, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
              </p>
              
              <div className="flex justify-center mb-3">
                <WeatherIcon
                  iconDesc={day.weather_desc}
                  className="w-10 h-10"
                />
              </div>

              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="font-bold text-lg dark:text-white">{day.temp_max}°</span>
                <span className="text-gray-400 text-sm">{day.temp_min}°</span>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2 h-4">
                {day.weather_desc}
              </p>

              {day.risks.length > 0 && day.risks[0] !== 'NORMAL' && (
                 <div className="inline-flex items-center justify-center px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] rounded-full font-bold">
                    ! Risk
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}