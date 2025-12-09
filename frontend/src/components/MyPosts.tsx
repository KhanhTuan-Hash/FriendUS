import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, MapPin, Edit2, Trash2 } from 'lucide-react';
import { 
  getCurrentUserPosts, 
  updatePost, 
  deletePost, 
  togglePostLike,
  Post,
  CURRENT_USER_ID,
  initializePostsDatabase
} from '../utils/postsDatabase';

interface MyPostsProps {
  onClose: () => void;
}

export function MyPosts({ onClose }: MyPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    initializePostsDatabase();
    loadPosts();
  }, []);

  const loadPosts = () => {
    setPosts(getCurrentUserPosts());
  };

  const handleLike = (postId: string) => {
    togglePostLike(postId, CURRENT_USER_ID);
    loadPosts();
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost(postId);
      loadPosts();
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
  };

  const handleSaveEdit = () => {
    if (editingPost) {
      updatePost(editingPost.id, editingPost.content, editingPost.location);
      loadPosts();
      setEditingPost(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl mb-1">My Posts</h2>
              <p className="text-sm opacity-90">{posts.length} posts shared</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No posts yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Share your travel experiences in the Community Feed to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  {editingPost?.id === post.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <textarea
                        value={editingPost.content}
                        onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        rows={3}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editingPost.location}
                        onChange={(e) => setEditingPost({ ...editingPost, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <p className="text-gray-800 dark:text-gray-200 mb-3">{post.content}</p>
                      
                      {post.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{post.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-2 ${
                              post.isLiked
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-600 dark:text-gray-400'
                            } hover:text-red-600 dark:hover:text-red-400 transition-colors`}
                          >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{post.comments.length}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{post.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
