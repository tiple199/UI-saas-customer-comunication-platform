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
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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

export interface UpdateCompanyRequest {
  name?: string;
  logoUrl?: string;
  status?: string;
}

export interface CompanyMember {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedAt?: string;
}

export interface CreateMemberAccountRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
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

export interface UpdateChannelRequest {
  name?: string;
  type?: ChannelType;
  status?: ChannelStatus;
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

export interface ChatRoomMember {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinAt?: string;
  lastReadMessageId?: number;
}

export interface PublicWidgetConfig {
  channelKey: string;
  name: string;
  welcomeMessage: string;
  aiEnabled: boolean;
}

export interface WidgetHandshakeRequest {
  channelKey: string;
  visitorToken?: string;
  name?: string;
  email?: string;
}

export interface WidgetHandshakeResponse {
  channelKey: string;
  channelName: string;
  welcomeMessage: string;
  aiEnabled: boolean;
  visitorId: number;
  visitorToken: string;
  visitorName?: string;
  visitorEmail?: string;
  isNewVisitor: boolean;
  conversationId: number;
  conversationStatus: ConversationStatus;
  handlingMode: HandlingMode;
  isNewConversation: boolean;
  connectedAt: string;
}

export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export type HandlingMode = 'AI' | 'HUMAN';

export interface Conversation {
  id: number;
  status: ConversationStatus;
  handlingMode: HandlingMode;
  assigneeId?: number | null;
  visitorId: number;
  visitorToken?: string;
  visitorName?: string;
  visitorEmail?: string;
  channelId: number;
  channelName?: string;
  channelType?: ChannelType;
  companyId: number;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
}

export interface CreateConversationRequest {
  channelId: number;
  visitorId: number;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  senderType: 'VISITOR' | 'AGENT' | 'AI' | string;
  senderId?: number | null;
  content: string;
  messageType: string;
  createdAt: string;
}

export interface RestoreConversationResponse {
  conversation: Conversation | null;
  messages: ConversationMessage[];
}

export interface WidgetSendMessageRequest {
  channelKey: string;
  visitorToken: string;
  content: string;
  messageType?: string;
}

// ========== KNOWLEDGE BASE / RAG ==========

export interface KnowledgeBase {
  id: number;
  name: string;
  description?: string | null;
  companyId: number;
  companyName?: string | null;
  documentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseRequest {
  name: string;
  description?: string;
}

export interface DocumentItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  status: string;
  chunkCount: number;
  knowledgeBaseId: number;
  knowledgeBaseName?: string | null;
  companyId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentPreview {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  chunkCount: number;
  knowledgeBaseId: number;
  knowledgeBaseName?: string | null;
  companyId: number;
  createdAt?: string;
  textContent?: string | null;
  isText: boolean;
  isPdf: boolean;
  isOffice: boolean;
  truncated: boolean;
}

export interface DocumentChunkSearchResult {
  chunkId: number;
  documentId: number;
  documentName: string;
  chunkIndex: number;
  content: string;
  similarityScore: number;
}

export interface RagContextResponse {
  companyId: number;
  knowledgeBaseId?: number | null;
  conversationId?: number | null;
  query: string;
  hasRelevantKnowledge: boolean;
  maxSimilarityScore: number;
  insufficientContext: boolean;
  humanHandoffRequested: boolean;
  insufficientReason?: string | null;
  matchedChunks: DocumentChunkSearchResult[];
  knowledgeContext: string;
  conversationHistoryContext: string;
  systemInstruction: string;
  fullPrompt: string;
}

export interface RagAskRequest {
  query: string;
  knowledgeBaseId?: number | null;
  conversationId?: number | null;
  topK?: number;
  minScore?: number;
}

export interface RagAskResponse {
  query: string;
  answer: string;
  hasRelevantKnowledge: boolean;
  insufficientContext: boolean;
  maxSimilarityScore: number;
  insufficientReason?: string | null;
  companyId: number;
  knowledgeBaseId?: number | null;
  conversationId?: number | null;
  matchedChunks: DocumentChunkSearchResult[];
}

export interface StaffHandoffNotification {
  type: string;
  companyId: number;
  conversationId: number;
  channelId: number;
  channelName?: string | null;
  visitorId: number;
  visitorName?: string | null;
  lastCustomerMessage?: string | null;
  reason?: string | null;
  message: string;
  createdAt?: string;
}




