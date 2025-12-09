// Database for user's friends, posts, and saved places

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  mutualFriends: number;
  status: 'online' | 'offline';
  lastActive: string;
  friendSince: string;
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
  comments: number;
  timestamp: string;
  isLiked: boolean;
  likedBy: string[]; // Array of user IDs who liked this post
}

export interface SavedPlace {
  id: string;
  name: string;
  location: string;
  category: string;
  image: string;
  rating: number;
  description: string;
  visitedDate: string | null;
  notes: string;
  isVisited: boolean;
}

// Dummy Friends Data
export const dummyFriends: Friend[] = [
  {
    id: '1',
    name: 'Tran Thi Mai',
    username: '@mailoveshanoi',
    avatar: '👩',
    location: 'Hanoi, Vietnam',
    mutualFriends: 23,
    status: 'online',
    lastActive: 'Active now',
    friendSince: 'March 2023'
  },
  {
    id: '2',
    name: 'Le Van Hieu',
    username: '@hieuexplorer',
    avatar: '🧑',
    location: 'Da Nang, Vietnam',
    mutualFriends: 15,
    status: 'online',
    lastActive: 'Active now',
    friendSince: 'January 2024'
  },
  {
    id: '3',
    name: 'Pham Thu Ha',
    username: '@hatravels',
    avatar: '😊',
    location: 'Hue, Vietnam',
    mutualFriends: 31,
    status: 'offline',
    lastActive: '2 hours ago',
    friendSince: 'May 2023'
  },
  {
    id: '4',
    name: 'Nguyen Duc Long',
    username: '@longadventures',
    avatar: '😎',
    location: 'Nha Trang, Vietnam',
    mutualFriends: 8,
    status: 'offline',
    lastActive: '5 hours ago',
    friendSince: 'August 2023'
  },
  {
    id: '5',
    name: 'Hoang Minh Tu',
    username: '@tuexplores',
    avatar: '🤗',
    location: 'Hoi An, Vietnam',
    mutualFriends: 19,
    status: 'online',
    lastActive: 'Active now',
    friendSince: 'February 2024'
  },
  {
    id: '6',
    name: 'Vo Thi Lan',
    username: '@lanthefoodie',
    avatar: '🥳',
    location: 'Ho Chi Minh City, Vietnam',
    mutualFriends: 42,
    status: 'offline',
    lastActive: '1 day ago',
    friendSince: 'December 2022'
  },
  {
    id: '7',
    name: 'Dang Van Khanh',
    username: '@khanhtrekker',
    avatar: '🤩',
    location: 'Sapa, Vietnam',
    mutualFriends: 12,
    status: 'online',
    lastActive: 'Active now',
    friendSince: 'July 2023'
  },
  {
    id: '8',
    name: 'Bui Thu Thao',
    username: '@thaophotography',
    avatar: '😇',
    location: 'Dalat, Vietnam',
    mutualFriends: 27,
    status: 'offline',
    lastActive: '3 hours ago',
    friendSince: 'April 2023'
  },
  {
    id: '9',
    name: 'Tran Quoc Bao',
    username: '@baowanderer',
    avatar: '🧔',
    location: 'Phu Quoc, Vietnam',
    mutualFriends: 6,
    status: 'offline',
    lastActive: '12 hours ago',
    friendSince: 'November 2023'
  },
  {
    id: '10',
    name: 'Nguyen Thi Linh',
    username: '@linhbeachvibes',
    avatar: '👱',
    location: 'Vung Tau, Vietnam',
    mutualFriends: 34,
    status: 'online',
    lastActive: 'Active now',
    friendSince: 'June 2023'
  }
];

// Dummy Posts Data
export const dummyPosts: Post[] = [
  {
    id: '1',
    authorId: '5',
    authorName: 'Hoang Minh Tu',
    authorUsername: '@tuexplores',
    authorAvatar: '🤗',
    content: 'Just explored the ancient temples of Hoi An! The lanterns at night are absolutely magical ✨🏮',
    images: [],
    location: 'Hoi An, Vietnam',
    likes: 142,
    comments: 23,
    timestamp: '2 hours ago',
    isLiked: true,
    likedBy: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  {
    id: '2',
    authorId: '1',
    authorName: 'Tran Thi Mai',
    authorUsername: '@mailoveshanoi',
    authorAvatar: '👩',
    content: 'Best pho I\'ve ever had! Found this hidden gem in the old quarter 🍜❤️',
    images: [],
    location: 'Hanoi, Vietnam',
    likes: 98,
    comments: 15,
    timestamp: '1 day ago',
    isLiked: false,
    likedBy: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  {
    id: '3',
    authorId: '1',
    authorName: 'Tran Thi Mai',
    authorUsername: '@mailoveshanoi',
    authorAvatar: '👩',
    content: 'Sunrise at Ha Long Bay never gets old. Mother nature at its finest! 🌅⛵',
    images: [],
    location: 'Ha Long Bay, Vietnam',
    likes: 256,
    comments: 42,
    timestamp: '3 days ago',
    isLiked: true,
    likedBy: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  {
    id: '4',
    authorId: '8',
    authorName: 'Bui Thu Thao',
    authorUsername: '@thaophotography',
    authorAvatar: '😇',
    content: 'Coffee with a view in Dalat. The cool weather here is so refreshing! ☕🌲',
    images: [],
    location: 'Dalat, Vietnam',
    likes: 187,
    comments: 31,
    timestamp: '5 days ago',
    isLiked: false,
    likedBy: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  },
  {
    id: '5',
    authorId: '9',
    authorName: 'Tran Quoc Bao',
    authorUsername: '@baowanderer',
    authorAvatar: '🧔',
    content: 'Beach hopping in Phu Quoc with the squad! Paradise found 🏖️🌴',
    images: [],
    location: 'Phu Quoc, Vietnam',
    likes: 312,
    comments: 58,
    timestamp: '1 week ago',
    isLiked: true,
    likedBy: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  }
];

// Dummy Saved Places Data
export const dummySavedPlaces: SavedPlace[] = [
  {
    id: '1',
    name: 'Ha Long Bay',
    location: 'Quang Ninh Province',
    category: 'Natural Wonder',
    image: '',
    rating: 4.9,
    description: 'UNESCO World Heritage Site with stunning limestone karsts and emerald waters',
    visitedDate: '2024-03-15',
    notes: 'Take the overnight cruise for best experience. Don\'t miss Sung Sot Cave!',
    isVisited: true
  },
  {
    id: '2',
    name: 'Hoi An Ancient Town',
    location: 'Quang Nam Province',
    category: 'Historical',
    image: '',
    rating: 4.8,
    description: 'Well-preserved ancient trading port with beautiful architecture and lanterns',
    visitedDate: '2024-02-10',
    notes: 'Visit during full moon for the lantern festival. Get clothes tailored here!',
    isVisited: true
  },
  {
    id: '3',
    name: 'Phong Nha-Ke Bang',
    location: 'Quang Binh Province',
    category: 'Cave System',
    image: '',
    rating: 4.9,
    description: 'Home to the world\'s largest cave - Son Doong Cave',
    visitedDate: null,
    notes: 'Need to book Son Doong tour months in advance. Paradise Cave is easier to access.',
    isVisited: false
  },
  {
    id: '4',
    name: 'Sapa Rice Terraces',
    location: 'Lao Cai Province',
    category: 'Mountain',
    image: '',
    rating: 4.7,
    description: 'Spectacular terraced fields with ethnic minority villages',
    visitedDate: '2023-09-20',
    notes: 'Best time: September-October for golden rice. Trek to Cat Cat village.',
    isVisited: true
  },
  {
    id: '5',
    name: 'Cu Chi Tunnels',
    location: 'Ho Chi Minh City',
    category: 'Historical',
    image: '',
    rating: 4.6,
    description: 'Historic underground network from Vietnam War',
    visitedDate: '2024-01-05',
    notes: 'Interesting historical site. The tunnels are very narrow!',
    isVisited: true
  },
  {
    id: '6',
    name: 'Phu Quoc Island',
    location: 'Kien Giang Province',
    category: 'Beach',
    image: '',
    rating: 4.8,
    description: 'Tropical paradise with pristine beaches and fresh seafood',
    visitedDate: null,
    notes: 'Want to visit Long Beach and try the night market. Maybe next summer!',
    isVisited: false
  },
  {
    id: '7',
    name: 'Dalat City',
    location: 'Lam Dong Province',
    category: 'Mountain City',
    image: '',
    rating: 4.7,
    description: 'Cool highland city known for flowers, coffee, and French architecture',
    visitedDate: '2023-12-18',
    notes: 'Great coffee everywhere! Visit Crazy House and Datanla Falls.',
    isVisited: true
  },
  {
    id: '8',
    name: 'Ninh Binh',
    location: 'Ninh Binh Province',
    category: 'Natural Wonder',
    image: '',
    rating: 4.8,
    description: 'Known as "Ha Long Bay on land" with limestone cliffs and rice paddies',
    visitedDate: null,
    notes: 'Planning to do the Tam Coc boat tour and visit Bai Dinh Pagoda',
    isVisited: false
  },
  {
    id: '9',
    name: 'Hue Imperial City',
    location: 'Thua Thien-Hue Province',
    category: 'Historical',
    image: '',
    rating: 4.6,
    description: 'Former imperial capital with royal tombs and citadel',
    visitedDate: '2024-02-28',
    notes: 'Try bun bo Hue! Visit Thien Mu Pagoda and royal tombs along the Perfume River.',
    isVisited: true
  },
  {
    id: '10',
    name: 'Ba Na Hills',
    location: 'Da Nang',
    category: 'Mountain Resort',
    image: '',
    rating: 4.5,
    description: 'Mountain resort famous for Golden Bridge held by giant hands',
    visitedDate: null,
    notes: 'Must see the Golden Bridge! Cable car ride is spectacular.',
    isVisited: false
  },
  {
    id: '11',
    name: 'Mekong Delta',
    location: 'Southern Vietnam',
    category: 'River Delta',
    image: '',
    rating: 4.7,
    description: 'Lush river delta with floating markets and fruit orchards',
    visitedDate: null,
    notes: 'Want to experience Cai Rang floating market early morning',
    isVisited: false
  },
  {
    id: '12',
    name: 'Con Dao Islands',
    location: 'Ba Ria-Vung Tau Province',
    category: 'Beach',
    image: '',
    rating: 4.9,
    description: 'Remote pristine islands with incredible marine life',
    visitedDate: null,
    notes: 'Bucket list! Perfect for diving and seeing sea turtles.',
    isVisited: false
  }
];

// LocalStorage keys
const FRIENDS_STORAGE_KEY = 'friendus_friends';
const POSTS_STORAGE_KEY = 'friendus_posts';
const SAVED_PLACES_STORAGE_KEY = 'friendus_saved_places';

// Initialize storage with dummy data if empty
export function initializeProfileDatabase() {
  if (!localStorage.getItem(FRIENDS_STORAGE_KEY)) {
    localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(dummyFriends));
  }
  if (!localStorage.getItem(POSTS_STORAGE_KEY)) {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(dummyPosts));
  }
  if (!localStorage.getItem(SAVED_PLACES_STORAGE_KEY)) {
    localStorage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(dummySavedPlaces));
  }
}

// Friends operations
export function getFriends(): Friend[] {
  const data = localStorage.getItem(FRIENDS_STORAGE_KEY);
  return data ? JSON.parse(data) : dummyFriends;
}

export function saveFriends(friends: Friend[]) {
  localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(friends));
}

export function removeFriend(friendId: string) {
  const friends = getFriends();
  const updated = friends.filter(f => f.id !== friendId);
  saveFriends(updated);
}

// Posts operations
export function getPosts(): Post[] {
  const data = localStorage.getItem(POSTS_STORAGE_KEY);
  return data ? JSON.parse(data) : dummyPosts;
}

export function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
}

export function togglePostLike(postId: string) {
  const posts = getPosts();
  const updated = posts.map(post => {
    if (post.id === postId) {
      return {
        ...post,
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      };
    }
    return post;
  });
  savePosts(updated);
  return updated;
}

// Saved Places operations
export function getSavedPlaces(): SavedPlace[] {
  const data = localStorage.getItem(SAVED_PLACES_STORAGE_KEY);
  return data ? JSON.parse(data) : dummySavedPlaces;
}

export function saveSavedPlaces(places: SavedPlace[]) {
  localStorage.setItem(SAVED_PLACES_STORAGE_KEY, JSON.stringify(places));
}

export function removeSavedPlace(placeId: string) {
  const places = getSavedPlaces();
  const updated = places.filter(p => p.id !== placeId);
  saveSavedPlaces(updated);
}

export function togglePlaceVisited(placeId: string, visitedDate: string | null) {
  const places = getSavedPlaces();
  const updated = places.map(place => {
    if (place.id === placeId) {
      return {
        ...place,
        isVisited: !place.isVisited,
        visitedDate: visitedDate
      };
    }
    return place;
  });
  saveSavedPlaces(updated);
  return updated;
}