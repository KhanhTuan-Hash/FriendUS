// src/utils/chatDatabase.ts
import { ChatConversation, Message } from '../types/chat';

// Key save in LocalStorage
const CHAT_STORAGE_KEY = 'friendus_conversations';
const FINANCE_STORAGE_KEY = 'friendus_finance';
const PLANNER_STORAGE_KEY = 'friendus_planner';
const MESSAGES_STORAGE_KEY = 'friendus_messages';

// --- Helper Functions ---
export function getLocalConversations(): any[] {
  const data = localStorage.getItem(CHAT_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveLocalConversations(conversations: any[]) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
}

export function findOrCreateChat(currentUser: any, targetUser: any): number {
  const conversations = getLocalConversations();

  // 1.Logic: Chat type 'individual' with targetUser 
  const existingChat = conversations.find(c => 
    c.type === 'individual' && 
    c.name === targetUser.name // check ID participants
  );

  if (existingChat) {
    return existingChat.id;
  }

  // 2. Make random ID with Chat.tsx 
  const newId = Date.now(); 

  const newChat = {
    id: newId,
    name: targetUser.name || targetUser.username || 'Unknown User', 
    avatar: targetUser.avatar || '👤',
    type: 'individual',
    lastMessage: 'Start a new conversation 👋',
    time: 'Just now',
    unread: 0,
    creator: currentUser.username || 'Me',
    participants: [currentUser.username, targetUser.username]
  };

  //Save chat
  const updatedList = [newChat, ...conversations];
  saveLocalConversations(updatedList);
  
  return newId;
}

// Take list finance in ID chat
export function getChatFinance(chatId: number): any[] {
  const allFinance = JSON.parse(localStorage.getItem(FINANCE_STORAGE_KEY) || '{}');
  return allFinance[chatId] || [];
}

// Post new finance to list
export function addChatFinance(chatId: number, item: any) {
  const allFinance = JSON.parse(localStorage.getItem(FINANCE_STORAGE_KEY) || '{}');
  
  if (!allFinance[chatId]) {
    allFinance[chatId] = [];
  }
  
  allFinance[chatId].push(item);
  
  localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(allFinance));
  return allFinance[chatId];
}

export function getChatPlanner(chatId: number): any[] {
  const allPlanner = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY) || '{}');
  return allPlanner[chatId] || [];
}

export function addChatPlanner(chatId: number, activity: any) {
  const allPlanner = JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY) || '{}');
  
  if (!allPlanner[chatId]) {
    allPlanner[chatId] = [];
  }
  
  allPlanner[chatId].push(activity);
  
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(allPlanner));
  return allPlanner[chatId];
}

// Take ID chat
export function getChatMessages(chatId: number): Message[] {
  const allMessages = JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) || '{}');
  return allMessages[chatId] || [];
}

// Save chat by ID
export function saveChatMessage(chatId: number, message: Message) {
  const allMessages = JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) || '{}');
  
  if (!allMessages[chatId]) {
    allMessages[chatId] = [];
  }
  
  // Add new mess
  allMessages[chatId].push(message);
  
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allMessages));
  
  // (Optional) Update chat
  updateConversationLastMessage(chatId, message.content, message.time);
  
  return allMessages[chatId];
}

// Update last chat
function updateConversationLastMessage(chatId: number, content: string, time: string) {
    const conversations = getLocalConversations();
    const updatedConversations = conversations.map(c => {
        if (c.id === chatId) {
            return { ...c, lastMessage: content, time: time };
        }
        return c;
    });
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedConversations));
}