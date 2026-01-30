export interface Product {
  id: string;
  user_id: string;
  title: string;
  content: string;
  price: number;
  location: string;
  image_url?: string;
  status: 'active' | 'sold' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  title: string;
  content: string;
  price: number;
  location: string;
  image_url?: string;
}

export interface ProductUpdate {
  title?: string;
  content?: string;
  price?: number;
  location?: string;
  image_url?: string;
  status?: 'active' | 'sold' | 'reserved';
}

export interface ChatRoom {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatRoomWithDetails extends ChatRoom {
  product?: Product;
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface ReviewInsert {
  product_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  is_anonymous?: boolean;
  seller_id?: string; // 검증용 (DB에 저장되지 않음)
}

export interface Profile {
  id: string;
  email: string;
  nickname: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
}
