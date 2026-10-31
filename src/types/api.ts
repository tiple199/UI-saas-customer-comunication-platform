export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  error?: string | null;
  details?: string[] | null;
}

export const isSuccess = <T>(res?: ApiResponse<T> | null): boolean => {
  return !!res && res.statusCode >= 200 && res.statusCode < 300;
};

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  currentCompanyId?: number | null;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface Company {
  id: number;
  name: string;
  logoUrl?: string;
  status: string;
  userRole?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyRequest {
  name: string;
}

export interface CompanyMember {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  joinedAt?: string;
}

export type ChannelType = 'WEB' | 'TELEGRAM' | 'FACEBOOK' | 'ZALO';

export type ChannelStatus = 'ACTIVE' | 'INACTIVE' | 'CONNECTING' | 'ERROR';

export interface Channel {
  id: number;
  channelKey: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  config?: Record<string, unknown> | null;
  aiEnabled?: boolean;
  companyId?: number;
  firstConnectedAt?: string;
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChannelRequest {
  name: string;
  type: ChannelType;
  config?: Record<string, unknown>;
  aiEnabled?: boolean;
}

export type ChatRoomType = 'DIRECT' | 'GROUP';

export interface ChatRoom {
  id: number;
  name: string;
  type: ChatRoomType;
  createBy: number;
  companyId?: number;
  avatarUrl?: string;
  partnerUserId?: number;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChatRoomRequest {
  name: string;
  type: ChatRoomType;
  memberUserIds?: number[];
}

export interface InternalMessage {
  id: number;
  senderId: number;
  content: string;
  messageType: string;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: string;
}
