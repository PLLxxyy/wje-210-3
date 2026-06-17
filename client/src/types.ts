export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
  created_at?: string;
}

export interface Item {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  expected_item: string;
  photo_desc: string;
  status: string;
  created_at: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_bio?: string;
  owner_avg_rating?: number | null;
  owner_rating_count?: number;
}

export interface Exchange {
  id: number;
  requester_id: number;
  owner_id: number;
  requested_item_id: number;
  offered_item_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requested_title?: string;
  requested_category?: string;
  requested_photo?: string;
  offered_title?: string;
  offered_category?: string;
  offered_photo?: string;
  owner_name?: string;
  requester_name?: string;
  partner_name?: string;
  my_rating?: number;
  received_rating?: number;
}

export interface Rating {
  id: number;
  exchange_id: number;
  rater_id: number;
  ratee_id: number;
  score: number;
  comment: string;
}

export const CATEGORIES = ['全部', '数码', '服饰', '书籍', '家居', '运动', '其他'];

export const CATEGORY_COLORS: Record<string, string> = {
  '数码': '#6366f1',
  '服饰': '#ec4899',
  '书籍': '#f59e0b',
  '家居': '#10b981',
  '运动': '#3b82f6',
  '其他': '#8b5cf6',
};

export const CATEGORY_ICONS: Record<string, string> = {
  '数码': '📱',
  '服饰': '👗',
  '书籍': '📚',
  '家居': '🏠',
  '运动': '⚽',
  '其他': '📦',
};
