import { create } from 'zustand'

interface ChatState {
  activeChatRoomId: string | null
  chatRooms: Array<{
    id: string
    buyerId: string
    sellerId: string
    productId: string | null
    lastMessage: string
    lastMessageAt: string
    otherUser: { id: string; name: string; avatar: string }
    product?: { id: string; title: string; images: string; price: number } | null
  }>
  messages: Array<{
    id: string
    chatRoomId: string
    senderId: string
    content: string
    imageUrl: string
    isRead: boolean
    createdAt: string
  }>
  unreadCount: number
  
  setActiveChatRoom: (roomId: string | null) => void
  setChatRooms: (rooms: ChatState['chatRooms']) => void
  setMessages: (messages: ChatState['messages']) => void
  addMessage: (message: ChatState['messages'][0]) => void
  setUnreadCount: (count: number) => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeChatRoomId: null,
  chatRooms: [],
  messages: [],
  unreadCount: 0,

  setActiveChatRoom: (roomId) => set({ activeChatRoomId: roomId }),
  setChatRooms: (chatRooms) => set({ chatRooms }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}))
