// Centralized Posts Database for FriendUS Social Media App
// This database is shared between user profile posts and community feed

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  images: string[];
  location: string;
  likes: number;
  comments: PostComment[];
  timestamp: string;
  createdAt: Date;
  isLiked: boolean;
  likedBy: string[]; // Array of user IDs who liked this post
  tags: string[]; // e.g., #travel, #food, #adventure
  type: 'text' | 'photo' | 'check-in' | 'trip-plan'; // Post types
}

// Current logged-in user ID (for demo purposes)
export const CURRENT_USER_ID = 'current-user';

// Comprehensive dummy posts database with diverse content
export const dummyPosts: Post[] = [
  {
    id: 'post-1',
    authorId: 'current-user',
    authorName: 'Nguyen Van An',
    authorUsername: '@vanan',
    authorAvatar: '👤',
    content: 'Just got back from an amazing weekend in Ha Long Bay! 🌅 The cruise was incredible and the seafood was fresh. Highly recommend the overnight boat tour for the full experience!',
    images: [],
    location: 'Ha Long Bay, Quang Ninh',
    likes: 234,
    comments: [
      {
        id: 'c1',
        authorId: '1',
        authorName: 'Tran Thi Mai',
        authorAvatar: '👩',
        content: 'Wow! This looks amazing! Which tour company did you use?',
        timestamp: '1 hour ago',
        likes: 5
      },
      {
        id: 'c2',
        authorId: '5',
        authorName: 'Hoang Minh Tu',
        authorAvatar: '🤗',
        content: 'I went there last month! Did you try the kayaking?',
        timestamp: '45 minutes ago',
        likes: 3
      }
    ],
    timestamp: '3 hours ago',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isLiked: false,
    likedBy: ['1', '2', '5', '8', '10'],
    tags: ['#HaLongBay', '#travel', '#cruise', '#Vietnam'],
    type: 'check-in'
  },
  {
    id: 'post-2',
    authorId: '1',
    authorName: 'Tran Thi Mai',
    authorUsername: '@mailoveshanoi',
    authorAvatar: '👩',
    content: 'Found the BEST bánh mì spot in Hanoi Old Quarter! 🥖🇻🇳 Only 25k VND and absolutely delicious. The lady has been making them for 30 years. Location in comments!',
    images: [],
    location: 'Old Quarter, Hanoi',
    likes: 389,
    comments: [
      {
        id: 'c3',
        authorId: 'current-user',
        authorName: 'Nguyen Van An',
        authorAvatar: '👤',
        content: 'Drop the location please! 🙏',
        timestamp: '2 hours ago',
        likes: 12
      },
      {
        id: 'c4',
        authorId: '6',
        authorName: 'Vo Thi Lan',
        authorAvatar: '🥳',
        content: 'Is this near Hoan Kiem Lake? I think I know this place!',
        timestamp: '1 hour ago',
        likes: 4
      },
      {
        id: 'c5',
        authorId: '1',
        authorName: 'Tran Thi Mai',
        authorAvatar: '👩',
        content: '@vanan Yes! It\'s on Hang Buom Street, near the intersection with Hang Giay. You can\'t miss it!',
        timestamp: '45 minutes ago',
        likes: 8
      }
    ],
    timestamp: '5 hours ago',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '2', '3', '4', '5', '7', '9'],
    tags: ['#food', '#banhmi', '#Hanoi', '#streetfood'],
    type: 'photo'
  },
  {
    id: 'post-3',
    authorId: '2',
    authorName: 'Le Van Hieu',
    authorUsername: '@hieuexplorer',
    authorAvatar: '🧑',
    content: 'Planning a Da Nang → Hoi An → Hue trip next month! 🗺️ Any recommendations for must-visit spots? Looking for both tourist attractions and local hidden gems. Budget: ~3M VND for 5 days.',
    images: [],
    location: 'Da Nang, Vietnam',
    likes: 156,
    comments: [
      {
        id: 'c6',
        authorId: '3',
        authorName: 'Pham Thu Ha',
        authorAvatar: '😊',
        content: 'You MUST visit the Imperial City in Hue! Also try bún bò Huế at Dong Ba Market 🍜',
        timestamp: '6 hours ago',
        likes: 15
      },
      {
        id: 'c7',
        authorId: '5',
        authorName: 'Hoang Minh Tu',
        authorAvatar: '🤗',
        content: 'In Hoi An, rent a bike and ride to An Bang Beach. Much nicer than the main beach and less crowded!',
        timestamp: '5 hours ago',
        likes: 18
      },
      {
        id: 'c8',
        authorId: '8',
        authorName: 'Bui Thu Thao',
        authorAvatar: '😇',
        content: 'Don\'t miss the Marble Mountains in Da Nang! And have coffee at one of the rooftop cafes downtown 😍',
        timestamp: '4 hours ago',
        likes: 10
      }
    ],
    timestamp: '8 hours ago',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isLiked: false,
    likedBy: ['3', '5', '8', '10'],
    tags: ['#DaNang', '#HoiAn', '#Hue', '#TripPlanning', '#CentralVietnam'],
    type: 'trip-plan'
  },
  {
    id: 'post-4',
    authorId: '5',
    authorName: 'Hoang Minh Tu',
    authorUsername: '@tuexplores',
    authorAvatar: '🤗',
    content: 'The lantern festival in Hoi An tonight was absolutely magical! ✨🏮 Every full moon they release thousands of lanterns on the river. This is what traveling is all about - experiencing local culture and traditions. Feeling grateful! 🙏',
    images: [],
    location: 'Hoi An Ancient Town, Quang Nam',
    likes: 567,
    comments: [
      {
        id: 'c9',
        authorId: 'current-user',
        authorName: 'Nguyen Van An',
        authorAvatar: '👤',
        content: 'This is on my bucket list! Did you buy a lantern to release?',
        timestamp: '3 hours ago',
        likes: 7
      },
      {
        id: 'c10',
        authorId: '1',
        authorName: 'Tran Thi Mai',
        authorAvatar: '👩',
        content: 'So beautiful! I need to time my next visit during full moon 🌕',
        timestamp: '2 hours ago',
        likes: 5
      }
    ],
    timestamp: '12 hours ago',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '1', '2', '3', '4', '6', '7', '9', '10'],
    tags: ['#HoiAn', '#lanternfestival', '#culture', '#fullmoon'],
    type: 'photo'
  },
  {
    id: 'post-5',
    authorId: '8',
    authorName: 'Bui Thu Thao',
    authorUsername: '@thaophotography',
    authorAvatar: '😇',
    content: 'Dalat in December = Perfect weather for coffee lovers! ☕❄️ The temperature is around 15-18°C, which is rare for Vietnam. Spent the whole day café hopping and the coffee here is absolutely incredible. My favorite was a small place with amazing views of the valley.',
    images: [],
    location: 'Dalat, Lam Dong',
    likes: 423,
    comments: [
      {
        id: 'c11',
        authorId: '6',
        authorName: 'Vo Thi Lan',
        authorAvatar: '🥳',
        content: 'I love Dalat! Which café was your favorite? I need to add it to my list!',
        timestamp: '1 day ago',
        likes: 8
      },
      {
        id: 'c12',
        authorId: '8',
        authorName: 'Bui Thu Thao',
        authorAvatar: '😇',
        content: '@lanthefoodie It\'s called "Mê Linh Coffee Garden" - incredible views and amazing coffee! 📍',
        timestamp: '22 hours ago',
        likes: 6
      }
    ],
    timestamp: '1 day ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '6', '7', '9'],
    tags: ['#Dalat', '#coffee', '#cafes', '#Vietnam'],
    type: 'check-in'
  },
  {
    id: 'post-6',
    authorId: '9',
    authorName: 'Tran Quoc Bao',
    authorUsername: '@baowanderer',
    authorAvatar: '🧔',
    content: 'Phu Quoc is PARADISE! 🏝️ Crystal clear water, white sand beaches, and the most amazing sunset I\'ve ever seen. Pro tip: rent a motorbike and explore the northern beaches - way less touristy than Long Beach. The island has so much more to offer!',
    images: [],
    location: 'Phu Quoc Island, Kien Giang',
    likes: 891,
    comments: [
      {
        id: 'c13',
        authorId: '10',
        authorName: 'Nguyen Thi Linh',
        authorAvatar: '👱',
        content: 'Which beach did you like most? I\'m going there next week! 🏖️',
        timestamp: '1 day ago',
        likes: 12
      },
      {
        id: 'c14',
        authorId: '9',
        authorName: 'Tran Quoc Bao',
        authorAvatar: '🧔',
        content: '@linhbeachvibes Bai Sao and Bai Dai were amazing! Also check out the night market for fresh seafood 🦞',
        timestamp: '20 hours ago',
        likes: 9
      },
      {
        id: 'c15',
        authorId: '4',
        authorName: 'Nguyen Duc Long',
        authorAvatar: '😎',
        content: 'Don\'t forget to try diving! The coral reefs are beautiful 🤿',
        timestamp: '18 hours ago',
        likes: 7
      }
    ],
    timestamp: '2 days ago',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '4', '10'],
    tags: ['#PhuQuoc', '#beach', '#island', '#paradise'],
    type: 'photo'
  },
  {
    id: 'post-7',
    authorId: '3',
    authorName: 'Pham Thu Ha',
    authorUsername: '@hatravels',
    authorAvatar: '😊',
    content: 'Just finished a 2-day trek through Sapa rice terraces! 🌾⛰️ My legs are sore but it was SO worth it. Stayed overnight with a local H\'mong family and learned about their culture. This is the real Vietnam that tourists often miss. Highly recommend going with a local guide!',
    images: [],
    location: 'Sapa, Lao Cai',
    likes: 678,
    comments: [
      {
        id: 'c16',
        authorId: '7',
        authorName: 'Dang Van Khanh',
        authorAvatar: '🤩',
        content: 'I\'m from Sapa! So happy you enjoyed it! Which villages did you visit?',
        timestamp: '2 days ago',
        likes: 20
      },
      {
        id: 'c17',
        authorId: '3',
        authorName: 'Pham Thu Ha',
        authorAvatar: '😊',
        content: '@khanhtrekker We visited Cat Cat, Y Linh Ho, and Lao Chai! Your hometown is beautiful! 😍',
        timestamp: '2 days ago',
        likes: 15
      }
    ],
    timestamp: '3 days ago',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isLiked: false,
    likedBy: ['7', '1', '2', '5'],
    tags: ['#Sapa', '#trekking', '#riceterraces', '#culture', '#Hmong'],
    type: 'photo'
  },
  {
    id: 'post-8',
    authorId: '6',
    authorName: 'Vo Thi Lan',
    authorUsername: '@lanthefoodie',
    authorAvatar: '🥳',
    content: 'Food crawl through Saigon\'s District 1! 🍜🥟🍛 Tried 12 different street food stalls in one evening. From bánh xèo to bún thịt nướng, every single dish was incredible. I\'ve created a complete guide with addresses and prices. Who wants it? Drop a 🙋 below!',
    images: [],
    location: 'District 1, Ho Chi Minh City',
    likes: 1234,
    comments: [
      {
        id: 'c18',
        authorId: 'current-user',
        authorName: 'Nguyen Van An',
        authorAvatar: '👤',
        content: '🙋🙋🙋 Please share the guide!',
        timestamp: '3 days ago',
        likes: 45
      },
      {
        id: 'c19',
        authorId: '1',
        authorName: 'Tran Thi Mai',
        authorAvatar: '👩',
        content: 'I need this! 🙋',
        timestamp: '3 days ago',
        likes: 32
      },
      {
        id: 'c20',
        authorId: '2',
        authorName: 'Le Van Hieu',
        authorAvatar: '🧑',
        content: 'This is exactly what I need for my trip! 🙋',
        timestamp: '2 days ago',
        likes: 28
      }
    ],
    timestamp: '4 days ago',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '1', '2', '3', '4', '5', '7', '8', '9', '10'],
    tags: ['#Saigon', '#streetfood', '#foodie', '#HCMC', '#vietnamesefood'],
    type: 'photo'
  },
  {
    id: 'post-9',
    authorId: '4',
    authorName: 'Nguyen Duc Long',
    authorUsername: '@longadventures',
    authorAvatar: '😎',
    content: 'Scuba diving in Nha Trang was INSANE! 🤿🐠 Saw sea turtles, colorful coral reefs, and so many tropical fish. The visibility was perfect at 20+ meters. If you\'re into diving, Vietnam has some seriously underrated dive spots. Already planning my next trip to Con Dao!',
    images: [],
    location: 'Nha Trang, Khanh Hoa',
    likes: 445,
    comments: [
      {
        id: 'c21',
        authorId: '9',
        authorName: 'Tran Quoc Bao',
        authorAvatar: '🧔',
        content: 'Which dive center did you use? I\'m planning to get certified!',
        timestamp: '4 days ago',
        likes: 10
      },
      {
        id: 'c22',
        authorId: '4',
        authorName: 'Nguyen Duc Long',
        authorAvatar: '😎',
        content: '@baowanderer I used Rainbow Divers - really professional and great instructors!',
        timestamp: '4 days ago',
        likes: 8
      }
    ],
    timestamp: '5 days ago',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isLiked: false,
    likedBy: ['9', '10'],
    tags: ['#NhaTrang', '#scubadiving', '#underwater', '#diving', '#Vietnam'],
    type: 'photo'
  },
  {
    id: 'post-10',
    authorId: '10',
    authorName: 'Nguyen Thi Linh',
    authorUsername: '@linhbeachvibes',
    authorAvatar: '👱',
    content: 'Quick weekend getaway to Vung Tau! 🌊 Only 2 hours from Saigon but feels like a different world. Fresh seafood, beautiful beaches, and the sunset from the Christ statue viewpoint is unbeatable. Perfect for when you need to escape the city chaos!',
    images: [],
    location: 'Vung Tau, Ba Ria',
    likes: 312,
    comments: [
      {
        id: 'c23',
        authorId: '6',
        authorName: 'Vo Thi Lan',
        authorAvatar: '🥳',
        content: 'I love Vung Tau for quick trips! Did you try the bánh khọt? 😋',
        timestamp: '5 days ago',
        likes: 9
      },
      {
        id: 'c24',
        authorId: '10',
        authorName: 'Nguyen Thi Linh',
        authorAvatar: '👱',
        content: '@lanthefoodie Yes! So good! Also had amazing grilled seafood by the beach 🦐',
        timestamp: '5 days ago',
        likes: 7
      }
    ],
    timestamp: '6 days ago',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '6'],
    tags: ['#VungTau', '#weekendtrip', '#beach', '#seafood'],
    type: 'check-in'
  },
  {
    id: 'post-11',
    authorId: 'current-user',
    authorName: 'Nguyen Van An',
    authorUsername: '@vanan',
    authorAvatar: '👤',
    content: 'Exploring the Mekong Delta floating markets! 🚤🥭 Woke up at 5 AM to catch the sunrise market and it was absolutely worth it. Bought fresh fruits directly from boats, tried amazing Vietnamese coffee on the water. This is a must-visit for anyone traveling to Southern Vietnam!',
    images: [],
    location: 'Cai Rang Floating Market, Can Tho',
    likes: 523,
    comments: [
      {
        id: 'c25',
        authorId: '1',
        authorName: 'Tran Thi Mai',
        authorAvatar: '👩',
        content: 'This looks incredible! How did you get there from Saigon?',
        timestamp: '1 week ago',
        likes: 11
      },
      {
        id: 'c26',
        authorId: 'current-user',
        authorName: 'Nguyen Van An',
        authorAvatar: '👤',
        content: '@mailoveshanoi Took a bus to Can Tho (about 3.5 hours) and arranged a boat tour through my hotel!',
        timestamp: '6 days ago',
        likes: 8
      }
    ],
    timestamp: '1 week ago',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isLiked: false,
    likedBy: ['1', '2', '5', '6', '8'],
    tags: ['#MekongDelta', '#floatingmarket', '#CanTho', '#SouthernVietnam'],
    type: 'photo'
  },
  {
    id: 'post-12',
    authorId: '7',
    authorName: 'Dang Van Khanh',
    authorUsername: '@khanhtrekker',
    authorAvatar: '🤩',
    content: 'Conquered Fansipan - the "Roof of Indochina"! 🏔️ 3,147 meters above sea level. The trek was challenging but the views from the top were absolutely breathtaking. Pro tip: Start early to avoid clouds and bring warm clothes - it gets COLD up there! ❄️',
    images: [],
    location: 'Fansipan, Sapa, Lao Cai',
    likes: 756,
    comments: [
      {
        id: 'c27',
        authorId: '3',
        authorName: 'Pham Thu Ha',
        authorAvatar: '😊',
        content: 'Congratulations! Did you take the cable car or trek all the way?',
        timestamp: '1 week ago',
        likes: 14
      },
      {
        id: 'c28',
        authorId: '7',
        authorName: 'Dang Van Khanh',
        authorAvatar: '🤩',
        content: '@hatravels Full trek! Took about 2 days. The cable car is easier but trekking gives you the real experience 💪',
        timestamp: '1 week ago',
        likes: 12
      }
    ],
    timestamp: '1 week ago',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isLiked: true,
    likedBy: ['current-user', '3', '5', '8'],
    tags: ['#Fansipan', '#trekking', '#Sapa', '#mountain', '#hiking'],
    type: 'photo'
  }
];

// LocalStorage key for posts
const POSTS_STORAGE_KEY = 'friendus_posts_database';

// Initialize posts database
export function initializePostsDatabase() {
  if (!localStorage.getItem(POSTS_STORAGE_KEY)) {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(dummyPosts));
  }
}

// Get all posts (sorted by most recent first)
export function getAllPosts(): Post[] {
  const data = localStorage.getItem(POSTS_STORAGE_KEY);
  const posts = data ? JSON.parse(data) : dummyPosts;
  return posts.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Get posts by specific author
export function getPostsByAuthor(authorId: string): Post[] {
  const allPosts = getAllPosts();
  return allPosts.filter(post => post.authorId === authorId);
}

// Get current user's posts
export function getCurrentUserPosts(): Post[] {
  return getPostsByAuthor(CURRENT_USER_ID);
}

// Save all posts to localStorage
export function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
}

// Create a new post
export function createPost(
  content: string,
  location: string,
  images: string[] = [],
  tags: string[] = [],
  type: Post['type'] = 'text'
): Post {
  const newPost: Post = {
    id: `post-${Date.now()}`,
    authorId: CURRENT_USER_ID,
    authorName: 'Nguyen Van An',
    authorUsername: '@vanan',
    authorAvatar: '👤',
    content,
    images,
    location,
    likes: 0,
    comments: [],
    timestamp: 'Just now',
    createdAt: new Date(),
    isLiked: false,
    likedBy: [],
    tags,
    type
  };

  const allPosts = getAllPosts();
  const updated = [newPost, ...allPosts];
  savePosts(updated);
  return newPost;
}

// Update a post
export function updatePost(postId: string, content: string, location: string): Post | null {
  const allPosts = getAllPosts();
  const postIndex = allPosts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  allPosts[postIndex] = {
    ...allPosts[postIndex],
    content,
    location
  };
  
  savePosts(allPosts);
  return allPosts[postIndex];
}

// Delete a post
export function deletePost(postId: string): boolean {
  const allPosts = getAllPosts();
  const updated = allPosts.filter(p => p.id !== postId);
  
  if (updated.length === allPosts.length) return false;
  
  savePosts(updated);
  return true;
}

// Toggle like on a post
export function togglePostLike(postId: string, userId: string = CURRENT_USER_ID): Post | null {
  const allPosts = getAllPosts();
  const postIndex = allPosts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const post = allPosts[postIndex];
  const isLiked = post.likedBy.includes(userId);
  
  if (isLiked) {
    // Unlike
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
    post.isLiked = false;
  } else {
    // Like
    post.likedBy.push(userId);
    post.likes += 1;
    post.isLiked = true;
  }
  
  savePosts(allPosts);
  return post;
}

// Add comment to a post
export function addComment(
  postId: string,
  content: string,
  authorId: string = CURRENT_USER_ID,
  authorName: string = 'Nguyen Van An',
  authorAvatar: string = '👤'
): PostComment | null {
  const allPosts = getAllPosts();
  const postIndex = allPosts.findIndex(p => p.id === postId);
  
  if (postIndex === -1) return null;
  
  const newComment: PostComment = {
    id: `comment-${Date.now()}`,
    authorId,
    authorName,
    authorAvatar,
    content,
    timestamp: 'Just now',
    likes: 0
  };
  
  allPosts[postIndex].comments.push(newComment);
  savePosts(allPosts);
  return newComment;
}

// Get posts from friends (for feed)
export function getFeedPosts(friendIds: string[] = []): Post[] {
  const allPosts = getAllPosts();
  // Return all posts for now, but can be filtered by friends later
  return allPosts;
}

// Search posts by content, location, or tags
export function searchPosts(query: string): Post[] {
  const allPosts = getAllPosts();
  const lowerQuery = query.toLowerCase();
  
  return allPosts.filter(post => 
    post.content.toLowerCase().includes(lowerQuery) ||
    post.location.toLowerCase().includes(lowerQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    post.authorName.toLowerCase().includes(lowerQuery)
  );
}

// Get trending posts (most liked in last 7 days)
export function getTrendingPosts(limit: number = 10): Post[] {
  const allPosts = getAllPosts();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return allPosts
    .filter(post => new Date(post.createdAt) > sevenDaysAgo)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limit);
}

// Format timestamp
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
