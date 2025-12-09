import { useState } from 'react';
import { Search, Navigation, Layers, MapPin, Star, Phone, Clock, Globe } from 'lucide-react';

interface MapLocation {
  id: number;
  name: string;
  category: string;
  rating: number;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  hours: string;
}

const locations: MapLocation[] = [
  {
    id: 1,
    name: 'Ben Thanh Market',
    category: 'Shopping',
    rating: 4.5,
    lat: 10.7719,
    lng: 106.6981,
    address: 'Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    phone: '+84 28 3822 5699',
    hours: '8:00 AM - 6:00 PM'
  },
  {
    id: 2,
    name: 'Hoan Kiem Lake',
    category: 'Tourist Attraction',
    rating: 4.7,
    lat: 21.0285,
    lng: 105.8542,
    address: 'Hoàn Kiếm, Hà Nội',
    phone: '+84 24 3825 4854',
    hours: 'Open 24 hours'
  },
  {
    id: 3,
    name: 'Dragon Bridge',
    category: 'Landmark',
    rating: 4.6,
    lat: 16.0544,
    lng: 108.2272,
    address: 'Cầu Rồng, Đà Nẵng',
    phone: '+84 236 3822 390',
    hours: 'Open 24 hours'
  },
  {
    id: 4,
    name: 'Cu Chi Tunnels',
    category: 'Historical Site',
    rating: 4.8,
    lat: 11.0513,
    lng: 106.4943,
    address: 'Phú Hiệp, Củ Chi, TP.HCM',
    phone: '+84 28 3794 8830',
    hours: '7:00 AM - 5:00 PM'
  },
  {
    id: 5,
    name: 'Marble Mountains',
    category: 'Nature & Parks',
    rating: 4.6,
    lat: 16.0042,
    lng: 108.2625,
    address: 'Hòa Hải, Ngũ Hành Sơn, Đà Nẵng',
    phone: '+84 236 3961 114',
    hours: '7:00 AM - 5:30 PM'
  },
  {
    id: 6,
    name: 'Imperial City of Hue',
    category: 'Historical Site',
    rating: 4.7,
    lat: 16.4637,
    lng: 107.5909,
    address: 'Thuận Thành, Huế',
    phone: '+84 234 3523 237',
    hours: '8:00 AM - 5:00 PM'
  },
  {
    id: 7,
    name: 'Phong Nha Cave',
    category: 'Nature & Parks',
    rating: 4.9,
    lat: 17.5820,
    lng: 106.2847,
    address: 'Sơn Trach, Bố Trạch, Quảng Bình',
    phone: '+84 232 3677 021',
    hours: '7:30 AM - 4:00 PM'
  },
  {
    id: 8,
    name: 'Bai Dinh Pagoda',
    category: 'Religious Site',
    rating: 4.6,
    lat: 20.2156,
    lng: 105.8897,
    address: 'Gia Sinh, Gia Viễn, Ninh Bình',
    phone: '+84 229 3881 968',
    hours: '6:00 AM - 6:00 PM'
  },
  {
    id: 9,
    name: 'Ha Long Bay',
    category: 'Tourist Attraction',
    rating: 4.9,
    lat: 20.9101,
    lng: 107.1839,
    address: 'Hạ Long, Quảng Ninh',
    phone: '+84 203 3846 592',
    hours: 'Open 24 hours'
  },
  {
    id: 10,
    name: 'My Son Sanctuary',
    category: 'Historical Site',
    rating: 4.5,
    lat: 15.7639,
    lng: 108.1233,
    address: 'Duy Phú, Duy Xuyên, Quảng Nam',
    phone: '+84 235 3731 309',
    hours: '6:30 AM - 5:00 PM'
  },
  {
    id: 11,
    name: 'Sapa Rice Terraces',
    category: 'Nature & Parks',
    rating: 4.8,
    lat: 22.3364,
    lng: 103.8438,
    address: 'Sa Pa, Lào Cai',
    phone: '+84 214 3871 975',
    hours: 'Open 24 hours'
  },
  {
    id: 12,
    name: 'Phu Quoc Island Beach',
    category: 'Beach',
    rating: 4.7,
    lat: 10.2899,
    lng: 103.9856,
    address: 'Phú Quốc, Kiên Giang',
    phone: '+84 297 3846 111',
    hours: 'Open 24 hours'
  }
];

export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
      setSelectedLocation(null);
    }
  };

  const filteredLocations = hasSearched
    ? locations.filter((location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Map Container */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-center gap-3 transition-colors duration-300">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search for places in Vietnam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1 outline-none bg-transparent dark:text-white dark:placeholder-gray-500"
            />
            <button 
              onClick={handleSearch}
              className="p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-24 right-4 z-10 flex flex-col gap-2">
          <button className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Layers className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* VietMap Placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 dark:from-green-900/30 dark:via-blue-900/30 dark:to-purple-900/30 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Location Markers - Only show when searched */}
          {hasSearched && filteredLocations.map((location, index) => {
            // Calculate better distributed positions
            const positions = [
              { top: '15%', left: '25%' },
              { top: '25%', left: '60%' },
              { top: '35%', left: '40%' },
              { top: '45%', left: '70%' },
              { top: '55%', left: '20%' },
              { top: '65%', left: '55%' },
              { top: '20%', left: '80%' },
              { top: '70%', left: '35%' },
              { top: '30%', left: '15%' },
              { top: '50%', left: '85%' },
              { top: '75%', left: '65%' },
              { top: '60%', left: '45%' },
            ];
            const position = positions[index % positions.length];
            
            return (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location)}
                className="absolute bg-gradient-to-br from-red-500 to-pink-600 text-white p-2.5 rounded-full shadow-xl hover:from-red-600 hover:to-pink-700 transition-all hover:scale-125 animate-bounce border-2 border-white dark:border-gray-800"
                style={{
                  top: position.top,
                  left: position.left,
                  animationDelay: `${index * 0.15}s`,
                  animationDuration: '2s'
                }}
              >
                <MapPin className="w-5 h-5 drop-shadow-lg" />
              </button>
            );
          })}

          {/* VietMap Branding */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md transition-colors duration-300">
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Powered by VietMap
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {hasSearched && (
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto transition-colors duration-300">
          {selectedLocation ? (
            /* Location Details */
            <div className="p-6">
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-blue-600 dark:text-blue-400 mb-4 hover:text-blue-700 dark:hover:text-blue-300"
              >
                ← Back to list
              </button>
              <h2 className="text-2xl mb-2 dark:text-white">{selectedLocation.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                  {selectedLocation.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="dark:text-white">{selectedLocation.rating}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedLocation.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedLocation.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hours</p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedLocation.hours}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  Get Directions
                </button>
                <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Call Now
                </button>
              </div>
            </div>
          ) : filteredLocations.length > 0 ? (
            /* Locations List - Only shown after search */
            <div className="p-6">
              <h2 className="text-2xl mb-4 dark:text-white">
                Nearby Places ({filteredLocations.length})
              </h2>
              <div className="space-y-3">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className="w-full text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors"
                  >
                    <h3 className="mb-1 dark:text-white">{location.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                        {location.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{location.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{location.address}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* No Results */
            <div className="p-6 flex flex-col items-center justify-center h-full">
              <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl mb-2 dark:text-white">No places found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                Try searching for different location or category
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}