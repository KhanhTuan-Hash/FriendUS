import { useState, useEffect } from 'react';
import { X, Search, Trash2, MapPin, Star, Calendar, StickyNote, Check } from 'lucide-react';
import { getSavedPlaces, removeSavedPlace, togglePlaceVisited, type SavedPlace } from '../utils/profileDatabase';

interface SavedPlacesProps {
  onClose: () => void;
}

export function SavedPlaces({ onClose }: SavedPlacesProps) {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterVisited, setFilterVisited] = useState<'all' | 'visited' | 'wishlist'>('all');

  useEffect(() => {
    setPlaces(getSavedPlaces());
  }, []);

  const handleRemovePlace = (placeId: string) => {
    if (confirm('Are you sure you want to remove this place from your saved list?')) {
      removeSavedPlace(placeId);
      setPlaces(getSavedPlaces());
    }
  };

  const handleToggleVisited = (placeId: string, currentVisited: boolean) => {
    const visitedDate = currentVisited ? null : new Date().toISOString().split('T')[0];
    togglePlaceVisited(placeId, visitedDate);
    setPlaces(getSavedPlaces());
  };

  const categories = ['all', ...Array.from(new Set(places.map(p => p.category)))];

  const filteredPlaces = places.filter(place => {
    const matchesSearch = 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      filterCategory === 'all' || place.category === filterCategory;

    const matchesVisited = 
      filterVisited === 'all' ||
      (filterVisited === 'visited' && place.isVisited) ||
      (filterVisited === 'wishlist' && !place.isVisited);

    return matchesSearch && matchesCategory && matchesVisited;
  });

  const visitedCount = places.filter(p => p.isVisited).length;
  const wishlistCount = places.filter(p => !p.isVisited).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">Saved Places</h2>
            <p className="text-purple-100 text-sm">
              {places.length} places saved • {visitedCount} visited • {wishlistCount} on wishlist
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search places by name, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterVisited('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterVisited === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({places.length})
              </button>
              <button
                onClick={() => setFilterVisited('visited')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterVisited === 'visited'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ✓ Visited ({visitedCount})
              </button>
              <button
                onClick={() => setFilterVisited('wishlist')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterVisited === 'wishlist'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ♡ Wishlist ({wishlistCount})
              </button>
            </div>
          </div>
        </div>

        {/* Places Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No places found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-600"
                >
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center text-white">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-80">{place.category}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Title and Rating */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                          {place.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {place.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                          {place.rating}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {place.description}
                    </p>

                    {/* Notes */}
                    {place.notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-800 dark:text-blue-300">
                            {place.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Visited Status */}
                    {place.isVisited && place.visitedDate && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Visited on {new Date(place.visitedDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleToggleVisited(place.id, place.isVisited)}
                        className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                          place.isVisited
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {place.isVisited ? 'Visited' : 'Mark as Visited'}
                      </button>
                      <button
                        onClick={() => handleRemovePlace(place.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}