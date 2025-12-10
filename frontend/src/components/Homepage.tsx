import { Star, TrendingUp, Users, MapPin, Heart, MessageCircle, Share2, Plus, Image as ImageIcon, X, Send, Search, Filter, ArrowLeft, ChevronRight, Paperclip } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback'; // Giữ nguyên import của bạn
import { useState, useEffect, useRef } from 'react';

// --- INTERFACES ---
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

// --- STATIC DATA (Giữ lại topPlaces để hiển thị phần Explore) ---
const topPlaces: Place[] = [
  { id: 1, name: 'Ha Long Bay', location: 'Quảng Ninh', rating: 4.9, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', reviews: 2534, region: 'North' },
  { id: 2, name: 'Hoi An Ancient Town', location: 'Quảng Nam', rating: 4.8, image: 'https://images.unsplash.com/photo-1552550186-b4d0847b2c0f', reviews: 1892, region: 'Central' },
  { id: 3, name: 'Sapa Rice Terraces', location: 'Lào Cai', rating: 4.7, image: 'https://images.unsplash.com/photo-1565538421033-6677f9202685', reviews: 1654, region: 'North' },
  // ... (Bạn có thể giữ nguyên danh sách dài cũ của bạn ở đây)
];

// --- MAIN COMPONENT ---
export function Homepage() {
  // State UI
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<string>('All');
  
  // State Data & Logic
  const [feedData, setFeedData] = useState<Feed[]>([]); // Khởi tạo rỗng để chờ load API
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [showShareModal, setShowShareModal] = useState<number | null>(null);

  // State Form (Post mới)
  const [newPost, setNewPost] = useState({ content: '', location: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref để kích hoạt input file ẩn

  // --- 1. LOAD DỮ LIỆU TỪ SERVER (GET) ---
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/feed');
        const data = await response.json();

        if (data.posts) {
          // Map dữ liệu từ Python (snake_case) sang Frontend (camelCase)
          const mappedFeeds: Feed[] = data.posts.map((post: any) => ({
            id: post.id,
            user: post.author.username || 'Anonymous',
            avatar: post.author.avatar || '👤',
            location: 'Vietnam', // Backend chưa lưu location cho bài viết, tạm hardcode hoặc update model sau
            content: post.body,
            image: post.media_url || '', // Nếu không có ảnh thì để chuỗi rỗng
            likes: 0, // Backend chưa có like, tạm để 0
            comments: 0, // Backend chưa có count comment
            time: post.timestamp ? new Date(post.timestamp).toLocaleDateString() : 'Just now',
            commentsList: []
          }));
          setFeedData(mappedFeeds);
        }
      } catch (error) {
        console.error("Lỗi tải feed:", error);
      }
    };

    fetchFeed();
  }, []);

  // --- 2. XỬ LÝ TẠO BÀI VIẾT (POST) ---
  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;

    // Chuẩn bị FormData để gửi file + text
    const formData = new FormData();
    formData.append('body', newPost.content);
    if (newPost.location) formData.append('location', newPost.location); // Lưu ý: Backend cần update model để nhận location này nếu muốn lưu
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/posts', {
        method: 'POST',
        body: formData, // Fetch tự động set Content-Type là multipart/form-data
      });

      if (response.ok) {
        const data = await response.json();
        
        // Tạo object feed mới từ response server để hiện ngay lập tức
        const newFeedItem: Feed = {
          id: data.post.id,
          user: data.post.author.username,
          avatar: '👤',
          location: newPost.location || 'Unknown',
          content: data.post.body,
          image: data.post.media_url || '',
          likes: 0,
          comments: 0,
          time: 'Just now',
          commentsList: []
        };

        setFeedData([newFeedItem, ...feedData]); // Thêm vào đầu danh sách
        
        // Reset form
        setNewPost({ content: '', location: '' });
        setSelectedFile(null);
        setShowCreatePost(false);
      } else {
        alert("Lỗi khi đăng bài!");
      }
    } catch (error) {
      console.error("Lỗi kết nối:", error);
    }
  };

  // Các hàm xử lý UI khác (Giữ nguyên)
  const handleLike = (feedId: number) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(feedId)) {
      newLikedPosts.delete(feedId);
      setFeedData(feedData.map(f => f.id === feedId ? { ...f, likes: f.likes - 1 } : f));
    } else {
      newLikedPosts.add(feedId);
      setFeedData(feedData.map(f => f.id === feedId ? { ...f, likes: f.likes + 1 } : f));
    }
    setLikedPosts(newLikedPosts);
  };

  const handleCommentToggle = (feedId: number) => setShowCommentsFor(showCommentsFor === feedId ? null : feedId);

  const handleAddComment = (feedId: number) => {
    if (!newComment[feedId]?.trim()) return;
    const comment: Comment = {
      id: Date.now(), user: 'You', avatar: '👤', content: newComment[feedId], time: 'Just now'
    };
    setFeedData(feedData.map(f => {
      if (f.id === feedId) return { ...f, comments: f.comments + 1, commentsList: [...(f.commentsList || []), comment] };
      return f;
    }));
    setNewComment({ ...newComment, [feedId]: '' });
  };

  const handleShare = (feedId: number) => setShowShareModal(feedId);

  const copyShareLink = (feedId: number) => {
    navigator.clipboard.writeText(`https://friendus.app/post/${feedId}`);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {showAllPlaces ? (
        // --- VIEW: ALL PLACES (Giữ nguyên phần này của bạn) ---
        <div className="min-h-screen">
          {/* Header */}
          <div className="mb-6">
            <button onClick={() => { setShowAllPlaces(false); setSearchQuery(''); }} className="flex items-center gap-2 text-blue-600 mb-4 group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> <span>Back to Home</span>
            </button>
            <h1 className="text-3xl text-gray-800 dark:text-white mb-2">Explore Vietnam</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover {filterPlaces(topPlaces).length} amazing destinations</p>
          </div>

          {/* Search & Filter UI (Giữ nguyên) */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
             <div className="relative mb-4">
               <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input type="text" placeholder="Search destinations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white" />
             </div>
             {/* Filter Buttons ... (Giữ nguyên code filter của bạn ở đây) */}
             <div className="flex flex-wrap gap-3">
                 {/* Region & Rating Filters Code */}
                 <div className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filters:</div>
                 {['All', 'North', 'Central', 'South'].map((region) => (
                    <button key={region} onClick={() => setSelectedRegion(region)} className={`px-4 py-2 rounded-lg ${selectedRegion === region ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>{region}</button>
                 ))}
             </div>
          </div>

          {/* Places Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterPlaces(topPlaces).map((place) => (
              <div key={place.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all">
                <div className="relative h-56">
                  <ImageWithFallback src={place.image} alt={place.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> <span>{place.rating}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg mb-2 dark:text-white">{place.name}</h3>
                  <div className="flex items-center gap-1 text-gray-600 mb-3"><MapPin className="w-4 h-4" /> <span className="text-sm">{place.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      {/* --- VIEW: HOME FEED --- */}
      
      {/* Hero Section (Giữ nguyên) */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <h2 className="text-3xl mb-2">Welcome to FriendUS</h2>
          <p className="text-lg opacity-90 mb-6">Connect with friends and explore the beauty of Vietnam together</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Icons grid... */}
          </div>
        </div>
      </section>

      {/* Top Rated Places Preview (Giữ nguyên) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><TrendingUp className="w-6 h-6 text-blue-600" /> <h2 className="text-2xl dark:text-white">Top Rated Places</h2></div>
          <button onClick={() => setShowAllPlaces(true)} className="text-blue-600">View All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPlaces.slice(0, 3).map((place) => (
            <div key={place.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
               <div className="relative h-48"><ImageWithFallback src={place.image} alt={place.name} className="w-full h-full object-cover" /></div>
               <div className="p-4"><h3 className="text-lg mb-1 dark:text-white">{place.name}</h3></div>
            </div>
          ))}
        </div>
      </section>

      {/* --- NEWS FEED SECTION --- */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><MessageCircle className="w-6 h-6 text-purple-600" /> <h2 className="text-2xl dark:text-white">Community Feed</h2></div>
          <button onClick={() => setShowCreatePost(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Create Post
          </button>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xl dark:text-white">Create New Post</h3>
                <button onClick={() => setShowCreatePost(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">👤</div>
                  <div><h4 className="dark:text-white">You</h4><p className="text-sm text-gray-600">@posting_now</p></div>
                </div>

                <textarea
                  placeholder="What's on your mind?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-600 mb-4 resize-none"
                />

                <div className="mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Location" value={newPost.location} onChange={(e) => setNewPost({ ...newPost, location: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                </div>

                {/* HIDDEN FILE INPUT & CUSTOM BUTTON */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*"
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-3 border-2 border-dashed rounded-lg mb-4 flex items-center justify-center gap-2 transition-colors ${selectedFile ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-blue-600 text-gray-600'}`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>{selectedFile ? `Selected: ${selectedFile.name}` : 'Add Photo'}</span>
                </button>

                <div className="flex gap-3">
                  <button onClick={handleCreatePost} disabled={!newPost.content.trim()} className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50">Post</button>
                  <button onClick={() => setShowCreatePost(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Feed */}
        <div className="space-y-4">
            {feedData.length === 0 && <p className="text-center text-gray-500 py-10">No posts yet. Be the first to share!</p>}
            
            {feedData.map((feed) => (
            <div key={feed.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">{feed.avatar}</div>
                <div className="flex-1">
                  <h3 className="dark:text-white">{feed.user}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-3 h-3" /> <span>{feed.location}</span> • <span>{feed.time}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-3"><p className="text-gray-700 dark:text-gray-300">{feed.content}</p></div>

              {/* Chỉ hiển thị ảnh nếu có URL hợp lệ */}
              {feed.image && (
                  <ImageWithFallback src={feed.image} alt="Feed post" className="w-full h-80 object-cover" />
              )}

              <div className="p-4 flex items-center justify-around border-t dark:border-gray-700">
                <button onClick={() => handleLike(feed.id)} className={`flex items-center gap-2 ${likedPosts.has(feed.id) ? 'text-red-500' : 'text-gray-600'}`}>
                  <Heart className={`w-5 h-5 ${likedPosts.has(feed.id) ? 'fill-red-500' : ''}`} /> <span>{feed.likes}</span>
                </button>
                <button onClick={() => handleCommentToggle(feed.id)} className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                  <MessageCircle className="w-5 h-5" /> <span>{feed.comments}</span>
                </button>
                <button onClick={() => handleShare(feed.id)} className="flex items-center gap-2 text-gray-600 hover:text-green-500">
                  <Share2 className="w-5 h-5" /> <span>Share</span>
                </button>
              </div>

              {/* Comment Section (Simple UI) */}
              {showCommentsFor === feed.id && (
                <div className="p-4 border-t dark:border-gray-700">
                  {feed.commentsList?.map((comment) => (
                    <div key={comment.id} className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">{comment.avatar}</div>
                       <div><h4 className="text-sm font-bold dark:text-white">{comment.user}</h4><p className="text-sm dark:text-gray-300">{comment.content}</p></div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 mt-2">
                    <input type="text" placeholder="Add a comment..." value={newComment[feed.id] || ''} onChange={(e) => setNewComment({ ...newComment, [feed.id]: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    <button onClick={() => handleAddComment(feed.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Post</button>
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