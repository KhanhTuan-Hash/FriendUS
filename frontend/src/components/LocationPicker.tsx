import { useState } from 'react';
import { Search, MapPin, Navigation, Star, X } from 'lucide-react';

interface MapLocation {
  id: number;
  name: string;
  category: string;
  rating: number;
  address: string;
}

const locations: MapLocation[] = [
  { id: 1, name: 'Ben Thanh Market', category: 'Shopping', rating: 4.5, address: 'Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM' },
  { id: 2, name: 'Hoan Kiem Lake', category: 'Tourist Attraction', rating: 4.7, address: 'Hoàn Kiếm, Hà Nội' },
  { id: 3, name: 'Dragon Bridge', category: 'Landmark', rating: 4.6, address: 'Cầu Rồng, Đà Nẵng' },
  { id: 4, name: 'Cu Chi Tunnels', category: 'Historical Site', rating: 4.8, address: 'Phú Hiệp, Củ Chi, TP.HCM' },
  { id: 5, name: 'Marble Mountains', category: 'Nature & Parks', rating: 4.6, address: 'Hòa Hải, Ngũ Hành Sơn, Đà Nẵng' },
  { id: 6, name: 'Imperial City of Hue', category: 'Historical Site', rating: 4.7, address: 'Thuận Thành, Huế' },
  { id: 7, name: 'Phong Nha Cave', category: 'Nature & Parks', rating: 4.9, address: 'Sơn Trach, Bố Trạch, Quảng Bình' },
  { id: 8, name: 'Bai Dinh Pagoda', category: 'Religious Site', rating: 4.6, address: 'Gia Sinh, Gia Viễn, Ninh Bình' },
  { id: 9, name: 'Ha Long Bay', category: 'Tourist Attraction', rating: 4.9, address: 'Hạ Long, Quảng Ninh' },
  { id: 10, name: 'My Son Sanctuary', category: 'Historical Site', rating: 4.5, address: 'Duy Phú, Duy Xuyên, Quảng Nam' },
  { id: 11, name: 'Sapa Rice Terraces', category: 'Nature & Parks', rating: 4.8, address: 'Sa Pa, Lào Cai' },
  { id: 12, name: 'Phu Quoc Island Beach', category: 'Beach', rating: 4.7, address: 'Phú Quốc, Kiên Giang' }
];

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showResults, setShowResults] = useState(false);

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (location: MapLocation) => {
    setSelectedLocation(location);
    setSearchQuery(location.address);
    onChange(location.address);
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onChange(e.target.value);
    setShowResults(true);
    setSelectedLocation(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="flex-1 flex items-center gap-3 px-4">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search for a location or type manually..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowResults(true)}
              className="flex-1 py-3 outline-none bg-transparent dark:text-white dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onChange('');
                  setSelectedLocation(null);
                  setShowResults(false);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{location.name}</h4>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                        {location.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{location.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location.address}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mini Map Preview */}
      <div className="relative w-full h-64 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 dark:from-green-900/30 dark:via-blue-900/30 dark:to-purple-900/30 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="minimap-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#minimap-grid)" />
          </svg>
        </div>

        {/* Selected Location Marker */}
        {selectedLocation && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
            <div className="relative">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-3 rounded-full shadow-xl border-4 border-white dark:border-gray-800">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-lg whitespace-nowrap border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLocation.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder Text */}
        {!selectedLocation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Search or select a location to preview
              </p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button className="bg-white dark:bg-gray-800 p-2 rounded shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Navigation className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* VietMap Branding */}
        <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md">
          <p className="text-xs text-gray-600 dark:text-gray-400">VietMap</p>
        </div>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Selected Location</h4>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{selectedLocation.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedLocation.address}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
