export interface User {
    id: string | number
    name?: string
  }
  
  export interface Conversation {
    id: string | number
    name?: string
    avatar?: string
    lastMessage?: string
    lastMessageTime?: string | Date
    role?: string
    status?: string
  }
  
  export interface Message {
    id: string | number
    content: string
    senderId: string | number
    timestamp?: string | Date
  }
  
  export interface UserData {
    id: string | number
    name?: string
    email?: string
    role?: string
  }
  