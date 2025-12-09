import { Star, TrendingUp, Users, MapPin, Heart, MessageCircle, Share2, Plus, Image as ImageIcon, X, Send, Search, Filter, ArrowLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

interface Place {
  id: number;
  name: string;
  location: string;
  rating: number;
  image: string;
  reviews: number;
  region?: string;
}

interface Feed {
  id: number;
  user: string;
  avatar: string;
  location: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  time: string;
  commentsList?: Comment[];
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  time: string;
}

const topPlaces: Place[] = [
  {
    id: 1,
    name: 'Ha Long Bay',
    location: 'Quảng Ninh Province',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1737484126640-7381808c768b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYSUyMExvbmclMjBCYXklMjBWaWV0bmFtfGVufDF8fHx8MTc2NTA4MzU4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    reviews: 2534,
    region: 'North'
  },
  {
    id: 2,
    name: 'Hoi An Ancient Town',
    location: 'Quảng Nam Province',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1664650440553-ab53804814b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIb2klMjBBbiUyMGFuY2llbnQlMjB0b3dufGVufDF8fHx8MTc2NTE3NTY1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    reviews: 1892,
    region: 'Central'
  },
  {
    id: 3,
    name: 'Sapa Rice Terraces',
    location: 'Lào Cai Province',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1694152341020-00449316a794?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTYXBhJTIwcmljZSUyMHRlcnJhY2VzJTIwVmlldG5hbXxlbnwxfHx8fDE3NjUxNzU2NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    reviews: 1654,
    region: 'North'
  },
  {
    id: 4,
    name: 'Phong Nha Cave',
    location: 'Quảng Bình Province',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1698658989153-a60a73549b4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQaG9uZyUyME5oYSUyMGNhdmUlMjBVaWV0bmFtfGVufDF8fHx8MTc2NTE5NDMwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 1423,
    region: 'Central'
  },
  {
    id: 5,
    name: 'Mekong Delta',
    location: 'Cần Thơ Province',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1736025008667-f5cd69956de5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNZWtvbmclMjBEZWx0YSUyMFZpZXRuYW18ZW58MXx8fHwxNzY1MTk0MzA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 2103,
    region: 'South'
  },
  {
    id: 6,
    name: 'Nha Trang Beach',
    location: 'Khánh Hòa Province',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1692449353169-20f861617766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOaGElMjBUcmFuZyUyMGJlYWNoJTIwVmlldG5hbXxlbnwxfHx8fDE3NjUxOTQzMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 3456,
    region: 'Central'
  },
  {
    id: 7,
    name: 'Dalat',
    location: 'Lâm Đồng Province',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1675701231005-53ba4be97f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEYWxhdCUyMGNpdHklMjBWaWV0bmFtfGVufDF8fHx8MTc2NTE5NDMwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 2789,
    region: 'Central'
  },
  {
    id: 8,
    name: 'Phu Quoc Island',
    location: 'Kiên Giang Province',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1746292448726-9e75b5f1067d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQaHUlMjBRdW9jJTIwaXNsYW5kfGVufDF8fHx8MTc2NTE5NDMwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 4123,
    region: 'South'
  },
  {
    id: 9,
    name: 'Ninh Binh',
    location: 'Ninh Bình Province',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1686766219304-5e2fb0df9d2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOaW5oJTIwQmluaCUyMFZpZXRuYW18ZW58MXx8fHwxNzY1MTk0MzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 1987,
    region: 'North'
  },
  {
    id: 10,
    name: 'Hue Imperial City',
    location: 'Thừa Thiên Huế Province',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1705823637026-92c0ef6d6222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIdWUlMjBpbXBlcmlhbCUyMGNpdHl8ZW58MXx8fHwxNzY1MTk0MzA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 2341,
    region: 'Central'
  },
  {
    id: 11,
    name: 'Con Dao Islands',
    location: 'Bà Rịa-Vũng Tàu Province',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1694748678433-251bff9628b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDb24lMjBEYW8lMjBpc2xhbmR8ZW58MXx8fHwxNzY1MTk0MzA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 1567,
    region: 'South'
  },
  {
    id: 12,
    name: 'Ba Na Hills',
    location: 'Đà Nẵng Province',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1741138327956-dfa75763b50d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCYSUyME5hJTIwSGlsbHMlMjBVaWV0bmFtfGVufDF8fHx8MTc2NTE5NDMwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    reviews: 2890,
    region: 'Central'
  }
];

const feeds: Feed[] = [
  {
    id: 1,
    user: 'Minh Nguyen',
    avatar: '👨',
    location: 'Ho Chi Minh City',
    content: 'Amazing street food experience in District 1! The pho here is absolutely incredible. Who wants to join next time?',
    image: 'https://images.unsplash.com/photo-1677837788890-52b69c42f3d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYW5vaSUyMHN0cmVldCUyMGZvb2QlMjBVaWV0bmFtfGVufDF8fHx8MTc2NTE3NTY1OXww&ixlib=rb-4.1.0&q=80&w=1080',
    likes: 124,
    comments: 18,
    time: '2 hours ago',
    commentsList: [
      { id: 1, user: 'Tuan Le', avatar: '🧑', content: 'Count me in! I love pho!', time: '1 hour ago' },
      { id: 2, user: 'Hoa Pham', avatar: '👩‍💼', content: 'Which restaurant is this? Looks amazing!', time: '1 hour ago' },
      { id: 3, user: 'Minh Nguyen', avatar: '👨', content: 'It\'s called Pho 2000! Near Ben Thanh Market', time: '50 min ago' }
    ]
  },
  {
    id: 2,
    user: 'Linh Tran',
    avatar: '👩',
    location: 'Da Nang',
    content: 'Sunset at My Khe Beach never gets old 🌅 Perfect spot for evening hangouts with friends!',
    image: 'https://images.unsplash.com/flagged/photo-1583863374731-4224cbbc8c36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEYSUyME5hbmclMjBiZWFjaCUyMFZpZXRuYW18ZW58MXx8fHwxNzY1MTc1NjU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    likes: 256,
    comments: 34,
    time: '5 hours ago',
    commentsList: [
      { id: 1, user: 'Khanh Vo', avatar: '👨‍💻', content: 'Beautiful shot! What camera did you use?', time: '4 hours ago' },
      { id: 2, user: 'Mai Nguyen', avatar: '👩‍🎓', content: 'I miss Da Nang so much! 😭', time: '3 hours ago' }
    ]
  }
];

export function Homepage() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    location: ''
  });
  const [feedData, setFeedData] = useState<Feed[]>(feeds);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [showShareModal, setShowShareModal] = useState<number | null>(null);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');

  const handleCreatePost = () => {
    if (newPost.content.trim()) {
      // Handle post creation
      setNewPost({ content: '', location: '' });
      setShowCreatePost(false);
    }
  };

  const handleLike = (feedId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(feedId)) {
      newLikedPosts.delete(feedId);
      setFeedData(feedData.map(f => 
        f.id === feedId ? { ...f, likes: f.likes - 1 } : f
      ));
    } else {
      newLikedPosts.add(feedId);
      setFeedData(feedData.map(f => 
        f.id === feedId ? { ...f, likes: f.likes + 1 } : f
      ));
    }
    setLikedPosts(newLikedPosts);
  };

  const handleCommentToggle = (feedId: number) => {
    setShowCommentsFor(showCommentsFor === feedId ? null : feedId);
  };

  const handleAddComment = (feedId: number) => {
    if (!newComment[feedId]?.trim()) return;
    
    const comment: Comment = {
      id: Date.now(),
      user: 'You (Nguyen Van An)',
      avatar: '👤',
      content: newComment[feedId],
      time: 'Just now'
    };

    setFeedData(feedData.map(f => {
      if (f.id === feedId) {
        return {
          ...f,
          comments: f.comments + 1,
          commentsList: [...(f.commentsList || []), comment]
        };
      }
      return f;
    }));

    setNewComment({ ...newComment, [feedId]: '' });
  };

  const handleShare = (feedId: number) => {
    setShowShareModal(feedId);
  };

  const copyShareLink = (feedId: number) => {
    const shareUrl = `https://friendus.app/post/${feedId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
    setShowShareModal(null);
  };

  const filterPlaces = (places: Place[]): Place[] => {
    return places.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegion === 'All' || place.region === selectedRegion;
      const matchesRating = selectedRating === 'All' || place.rating >= parseFloat(selectedRating);
      return matchesSearch && matchesRegion && matchesRating;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {showAllPlaces ? (
        /* All Places View */
        <div className="min-h-screen">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => {
                setShowAllPlaces(false);
                setSearchQuery('');
                setSelectedRegion('All');
                setSelectedRating('All');
              }}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl text-gray-800 dark:text-white mb-2">Explore Vietnam</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover {filterPlaces(topPlaces).length} amazing destinations</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 transition-colors">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
              </div>
              
              {/* Region Filters */}
              <div className="flex flex-wrap gap-2">
                {['All', 'North', 'Central', 'South'].map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedRegion === region
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {region === 'All' ? '🇻🇳 All Regions' : `${region}`}
                  </button>
                ))}
              </div>

              {/* Rating Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '⭐ All Ratings', value: 'All' },
                  { label: '⭐⭐⭐⭐ 4.0+', value: '4.0' },
                  { label: '⭐⭐⭐⭐⭐ 4.5+', value: '4.5' },
                  { label: '⭐⭐⭐⭐⭐ 4.8+', value: '4.8' }
                ].map((rating) => (
                  <button
                    key={rating.value}
                    onClick={() => setSelectedRating(rating.value)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedRating === rating.value
                        ? 'bg-purple-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Places Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterPlaces(topPlaces).map((place) => (
              <div
                key={place.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="relative h-56">
                  <ImageWithFallback
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-900 dark:text-white">{place.rating}</span>
                  </div>
                  {place.region && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">
                      {place.region}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg mb-2 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{place.name}</h3>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{place.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{place.reviews.toLocaleString()} reviews</p>
                    <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filterPlaces(topPlaces).length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl text-gray-700 dark:text-gray-300 mb-2">No destinations found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-700 dark:to-purple-800 rounded-2xl p-8 text-white shadow-xl transition-colors duration-300">
          <h2 className="text-3xl mb-2">Welcome to FriendUS</h2>
          <p className="text-lg opacity-90 mb-6">
            Connect with friends and explore the beauty of Vietnam together
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <MapPin className="w-8 h-8 mb-2" />
              <h3 className="mb-1">Discover Places</h3>
              <p className="text-sm opacity-90">Explore top-rated destinations across Vietnam</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="mb-1">Plan Together</h3>
              <p className="text-sm opacity-90">Organize trips with friends and split costs</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <MessageCircle className="w-8 h-8 mb-2" />
              <h3 className="mb-1">Stay Connected</h3>
              <p className="text-sm opacity-90">Chat and share experiences in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Places */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl text-gray-800 dark:text-white">Top Rated Places</h2>
          </div>
          <button
            onClick={() => setShowAllPlaces(true)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPlaces.slice(0, 3).map((place) => (
            <div
              key={place.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-48">
                <ImageWithFallback
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-900 dark:text-white">{place.rating}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg mb-1 dark:text-white">{place.name}</h3>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{place.location}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{place.reviews.toLocaleString()} reviews</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* News Feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl text-gray-800 dark:text-white">Community Feed</h2>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Post
          </button>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl dark:text-white">Create New Post</h3>
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 dark:text-gray-300" />
                </button>
              </div>

              <div className="p-6">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">
                    👤
                  </div>
                  <div>
                    <h4 className="dark:text-white">Nguyen Van An</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@vanan_travels</p>
                  </div>
                </div>

                {/* Post Content */}
                <textarea
                  placeholder="What's on your mind? Share your travel experience..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4 resize-none transition-colors"
                />

                {/* Location */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Add location (e.g., Hanoi, Vietnam)"
                      value={newPost.location}
                      onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                    />
                  </div>
                </div>

                {/* Add Photo Button */}
                <button className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4">
                  <ImageIcon className="w-5 h-5" />
                  <span>Add Photo</span>
                </button>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content.trim()}
                    className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {feedData.map((feed) => (
            <div key={feed.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors duration-300">
              {/* User Info */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">
                  {feed.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="dark:text-white">{feed.user}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{feed.location}</span>
                    <span>•</span>
                    <span>{feed.time}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-700 dark:text-gray-300">{feed.content}</p>
              </div>

              {/* Image */}
              <ImageWithFallback
                src={feed.image}
                alt="Feed post"
                className="w-full h-80 object-cover"
              />

              {/* Actions */}
              <div className="p-4 flex items-center justify-around border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handleLike(feed.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    likedPosts.has(feed.id)
                      ? 'text-red-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedPosts.has(feed.id) ? 'fill-red-500' : ''
                    }`}
                  />
                  <span>{feed.likes}</span>
                </button>
                <button
                  onClick={() => handleCommentToggle(feed.id)}
                  className={`flex items-center gap-2 transition-colors text-[16px] ${
                    showCommentsFor === feed.id
                      ? 'text-blue-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{feed.comments}</span>
                </button>
                <button
                  onClick={() => handleShare(feed.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments */}
              {showCommentsFor === feed.id && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  {feed.commentsList && (
                    feed.commentsList.map((comment) => (
                      <div key={comment.id} className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xl">
                          {comment.avatar}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold dark:text-white">{comment.user}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{comment.time}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment[feed.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [feed.id]: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                    />
                    <button
                      onClick={() => handleAddComment(feed.id)}
                      className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}

              {/* Share Modal */}
              {showShareModal === feed.id && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-xl dark:text-white">Share Post</h3>
                      <button
                        onClick={() => setShowShareModal(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 dark:text-gray-300" />
                      </button>
                    </div>

                    <div className="p-6">
                      <p className="text-gray-700 dark:text-gray-300">Share this post with your friends:</p>
                      <div className="mt-4">
                        <button
                          onClick={() => copyShareLink(feed.id)}
                          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}