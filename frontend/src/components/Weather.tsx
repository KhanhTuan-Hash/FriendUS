import { useState } from 'react';
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
  TrendingDown
} from 'lucide-react';

interface CityWeather {
  id: number;
  city: string;
  region: string;
  temperature: number;
  condition: string;
  icon: 'sun' | 'cloud' | 'rain';
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  aqi: number;
  aqiLevel: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  forecast: {
    day: string;
    high: number;
    low: number;
    condition: string;
  }[];
}

const weatherData: CityWeather[] = [
  {
    id: 1,
    city: 'Hanoi',
    region: 'Northern Vietnam',
    temperature: 28,
    condition: 'Partly Cloudy',
    icon: 'cloud',
    humidity: 75,
    windSpeed: 12,
    visibility: 10,
    pressure: 1013,
    aqi: 68,
    aqiLevel: 'Moderate',
    forecast: [
      { day: 'Mon', high: 30, low: 24, condition: 'Sunny' },
      { day: 'Tue', high: 29, low: 23, condition: 'Cloudy' },
      { day: 'Wed', high: 28, low: 22, condition: 'Rainy' },
      { day: 'Thu', high: 27, low: 21, condition: 'Cloudy' },
      { day: 'Fri', high: 29, low: 23, condition: 'Sunny' }
    ]
  },
  {
    id: 2,
    city: 'Ho Chi Minh City',
    region: 'Southern Vietnam',
    temperature: 32,
    condition: 'Sunny',
    icon: 'sun',
    humidity: 82,
    windSpeed: 8,
    visibility: 9,
    pressure: 1010,
    aqi: 95,
    aqiLevel: 'Moderate',
    forecast: [
      { day: 'Mon', high: 33, low: 26, condition: 'Sunny' },
      { day: 'Tue', high: 34, low: 27, condition: 'Sunny' },
      { day: 'Wed', high: 32, low: 26, condition: 'Rainy' },
      { day: 'Thu', high: 31, low: 25, condition: 'Cloudy' },
      { day: 'Fri', high: 33, low: 26, condition: 'Sunny' }
    ]
  },
  {
    id: 3,
    city: 'Da Nang',
    region: 'Central Vietnam',
    temperature: 30,
    condition: 'Light Rain',
    icon: 'rain',
    humidity: 78,
    windSpeed: 15,
    visibility: 8,
    pressure: 1012,
    aqi: 45,
    aqiLevel: 'Good',
    forecast: [
      { day: 'Mon', high: 31, low: 25, condition: 'Rainy' },
      { day: 'Tue', high: 30, low: 24, condition: 'Cloudy' },
      { day: 'Wed', high: 29, low: 24, condition: 'Sunny' },
      { day: 'Thu', high: 30, low: 25, condition: 'Sunny' },
      { day: 'Fri', high: 31, low: 25, condition: 'Cloudy' }
    ]
  }
];

const getAQIColor = (level: string) => {
  switch (level) {
    case 'Good':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Unhealthy':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Hazardous':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const WeatherIcon = ({ icon, className = "w-12 h-12" }: { icon: string; className?: string }) => {
  switch (icon) {
    case 'sun':
      return <Sun className={`${className} text-yellow-500`} />;
    case 'rain':
      return <CloudRain className={`${className} text-blue-500`} />;
    case 'cloud':
    default:
      return <Cloud className={`${className} text-gray-700`} />;
  }
};

export function Weather() {
  const [selectedCity, setSelectedCity] = useState<CityWeather>(weatherData[0]);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center gap-3 transition-colors duration-300">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search for a city in Vietnam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none bg-transparent dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* City Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {weatherData.map((city) => (
          <button
            key={city.id}
            onClick={() => setSelectedCity(city)}
            className={`bg-white dark:bg-gray-800 rounded-lg p-4 text-left transition-all duration-300 ${
              selectedCity.id === city.id
                ? 'ring-2 ring-blue-600 dark:ring-blue-500 shadow-lg'
                : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg dark:text-white">{city.city}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{city.region}</p>
              </div>
              <WeatherIcon icon={city.icon} className="w-10 h-10" />
            </div>
            <p className="text-3xl mb-1 dark:text-white">{city.temperature}°C</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{city.condition}</p>
          </button>
        ))}
      </div>

      {/* Main Weather Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Weather */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-2xl p-8 text-white shadow-xl transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5" />
            <h2 className="text-2xl">{selectedCity.city}</h2>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-7xl mb-2">{selectedCity.temperature}°C</p>
              <p className="text-xl opacity-90">{selectedCity.condition}</p>
            </div>
            <WeatherIcon icon={selectedCity.icon} className="w-32 h-32" />
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Droplets className="w-4 h-4" />
                <span className="text-sm">Humidity</span>
              </div>
              <p className="text-xl">{selectedCity.humidity}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Wind className="w-4 h-4" />
                <span className="text-sm">Wind</span>
              </div>
              <p className="text-xl">{selectedCity.windSpeed} km/h</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Visibility</span>
              </div>
              <p className="text-xl">{selectedCity.visibility} km</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1 opacity-80">
                <Gauge className="w-4 h-4" />
                <span className="text-sm">Pressure</span>
              </div>
              <p className="text-xl">{selectedCity.pressure} mb</p>
            </div>
          </div>
        </div>

        {/* Air Quality */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl dark:text-white">Air Quality</h3>
          </div>

          <div className="text-center mb-6">
            <div className="relative inline-block">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={
                    selectedCity.aqiLevel === 'Good'
                      ? '#10b981'
                      : selectedCity.aqiLevel === 'Moderate'
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(selectedCity.aqi / 200) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl dark:text-white">{selectedCity.aqi}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AQI</p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`px-4 py-2 rounded-lg border text-center mb-4 ${getAQIColor(
              selectedCity.aqiLevel
            )}`}
          >
            <p>{selectedCity.aqiLevel}</p>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {selectedCity.aqiLevel === 'Good' && (
              <p className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                Air quality is satisfactory, outdoor activities recommended
              </p>
            )}
            {selectedCity.aqiLevel === 'Moderate' && (
              <p className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                Acceptable air quality, unusually sensitive people should limit outdoor exposure
              </p>
            )}
            {(selectedCity.aqiLevel === 'Unhealthy' ||
              selectedCity.aqiLevel === 'Hazardous') && (
              <p className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />
                Unhealthy air quality, limit prolonged outdoor activities
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
        <h3 className="text-xl mb-4 dark:text-white">5-Day Forecast</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {selectedCity.forecast.map((day, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{day.day}</p>
              <WeatherIcon
                icon={
                  day.condition.toLowerCase().includes('rain')
                    ? 'rain'
                    : day.condition.toLowerCase().includes('cloud')
                    ? 'cloud'
                    : 'sun'
                }
                className="w-8 h-8 mx-auto mb-2"
              />
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-gray-800 dark:text-gray-200">{day.high}°</span>
                <span className="text-gray-400">{day.low}°</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{day.condition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}