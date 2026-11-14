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

export type PlanStatus = 'ACTIVE' | 'INACTIVE';

export interface Plan {
  id: number;
  name: string;
  price: number;
  maxUser: number;
  maxChannel: number;
  aiEnabled: boolean;
  aiQuota: number;
  storageLimit: number;
  status: PlanStatus;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  maxUser: number;
  maxChannel: number;
  aiEnabled: boolean;
  aiQuota?: number;
  storageLimit: number;
  status?: PlanStatus;
}

export interface UpdatePlanRequest {
  name?: string;
  price?: number;
  maxUser?: number;
  maxChannel?: number;
  aiEnabled?: boolean;
  aiQuota?: number;
  storageLimit?: number;
  status?: PlanStatus;
}

export interface UsageStats {
  maxUsers?: number;
  activeUsers: number;
  maxChannels?: number;
  activeChannels: number;
  storageLimitMb?: number;
  usedStorageBytes: number;
  aiEnabled: boolean;
  aiQuota?: number;
  usedAiQuotaThisMonth: number;
}

export interface CompanySubscription {
  id?: number;
  companyId: number;
  plan?: Plan | null;
  status: string;
  startAt?: string | null;
  endAt?: string | null;
  pendingPlanId?: number | null;
  pendingPlan?: Plan | null;
  usage?: UsageStats | null;
}

export interface UpgradeSubscriptionRequest {
  targetPlanId: number;
  durationMonths?: number;
  paymentProvider?: string;
}

export interface UpgradeSubscriptionResponse {
  subscriptionId: number;
  companyId: number;
  previousPlan?: Plan | null;
  upgradedPlan: Plan;
  status: string;
  startAt: string;
  endAt: string;
  amountPaid: number;
  fullPrice?: number;
  unusedCreditAmount?: number;
  remainingDaysCredited?: number;
  paymentProvider: string;
  transactionRef: string;
  message: string;
}

export interface UpgradeCalculationResponse {
  targetPlanId: number;
  targetPlanName: string;
  targetPlanPrice: number;
  durationMonths: number;
  fullNewPlanAmount: number;
  unusedCreditAmount: number;
  remainingDays: number;
  finalAmountToPay: number;
  annualOnly?: boolean;
  annualOnlyReason?: string;
}


export interface DowngradeSubscriptionRequest {
  targetPlanId: number;
  reason?: string;
}

export interface DowngradeSubscriptionResponse {
  subscriptionId: number;
  companyId: number;
  currentPlan?: Plan | null;
  pendingPlan: Plan;
  effectiveDate: string;
  message: string;
}

export interface RenewSubscriptionRequest {
  durationMonths: number;
  paymentProvider?: string;
}

export interface RenewSubscriptionResponse {
  subscriptionId: number;
  companyId: number;
  plan: Plan;
  status: string;
  previousEndAt?: string | null;
  newEndAt: string;
  durationMonths: number;
  amountPaid: number;
  paymentProvider: string;
  transactionRef: string;
  message: string;
}

export interface CreatePaymentOrderRequest {
  orderType: 'UPGRADE' | 'RENEW';
  targetPlanId?: number;
  durationMonths?: number;
  paymentProvider?: string;
  note?: string;
}

export interface PaymentOrderResponse {
  paymentId: number;
  transactionRef: string;
  orderType: 'UPGRADE' | 'RENEW';
  amount: number;
  fullPrice?: number;
  unusedCreditAmount?: number;
  remainingDaysCredited?: number;
  currency: string;
  status: string;
  targetPlanId?: number;
  targetPlanName?: string;
  durationMonths: number;
  provider: string;
  qrCodeUrl?: string;
  bankCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  transferContent?: string;
  checkoutUrl?: string;
  createdAt: string;
  expiresAt: string;
  message?: string;
}

export interface PaymentResponse {
  id: number;
  subscriptionId?: number;
  companyId?: number;
  companyName?: string;
  planName?: string;
  orderType?: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  transactionRef: string;
  description?: string;
  durationMonths?: number;
  createdAt: string;
  paidAt?: string;
}

export interface ConfirmPaymentRequest {
  transactionRef: string;
  note?: string;
}

export interface PlanDistributionItem {
  planId: number;
  planName: string;
  monthlyPrice: number;
  companyCount: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  label: string;
  revenue: number;
  transactionCount: number;
  newCompanies: number;
}

export interface SuperAdminRecentPaymentItem {
  id: number;
  transactionRef: string;
  companyId?: number;
  companyName?: string;
  planName?: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface SuperAdminRecentCompanyItem {
  id: number;
  name: string;
  logoUrl?: string;
  status?: string;
  currentPlanName?: string;
  memberCount: number;
  createdAt: string;
}

export interface SuperAdminDashboardResponse {
  totalCompanies: number;
  newCompaniesThisMonth: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  revenueThisMonth: number;
  totalConversations: number;
  totalChannels: number;
  planDistributions: PlanDistributionItem[];
  monthlyTrends: MonthlyTrendItem[];
  recentPayments: SuperAdminRecentPaymentItem[];
  recentCompanies: SuperAdminRecentCompanyItem[];
}

export interface SuperAdminCompanyItemDto {
  id: number;
  name: string;
  logoUrl?: string;
  status?: string;
  createdAt: string;
  ownerId?: number;
  ownerName?: string;
  ownerEmail?: string;
  planId?: number;
  planName?: string;
  subscriptionStatus?: string;
  subscriptionStartAt?: string;
  subscriptionEndAt?: string;
  memberCount: number;
  channelCount: number;
  conversationCount: number;
  totalPaid: number;
}

export interface SuperAdminCompanyDetailDto extends SuperAdminCompanyItemDto {
  maxUsers?: number;
  maxChannels?: number;
  storageLimitMb?: number;
  usedStorageBytes?: number;
  aiEnabled?: boolean;
  aiQuota?: number;
  usedAiQuotaThisMonth?: number;
  recentPayments?: RecentPaymentDto[];
  members?: CompanyMember[];
}

export interface RecentPaymentDto {
  id: number;
  transactionRef: string;
  companyId?: number;
  companyName?: string;
  planName?: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface UpdateCompanyStatusRequest {
  status: string;
  reason?: string;
}

export interface SuperAdminAssignPlanRequest {
  planId: number;
  durationMonths?: number;
  note?: string;
}

export interface SuperAdminSubscriptionItemDto {
  id: number;
  companyId?: number;
  companyName?: string;
  companyStatus?: string;
  ownerName?: string;
  ownerEmail?: string;
  planId?: number;
  planName?: string;
  planPrice?: number;
  status: string;
  startAt?: string;
  endAt?: string;
  isLifetime: boolean;
  daysRemaining?: number;
  pendingPlanId?: number;
  pendingPlanName?: string;
  createdAt: string;
}

export interface SuperAdminSubscriptionStatsDto {
  totalSubscriptions: number;
  activeSubscriptions: number;
  paidSubscriptions: number;
  freeSubscriptions: number;
  expiringIn7Days: number;
  estimatedMrr: number;
}

export interface ExtendSubscriptionRequest {
  months: number;
  note?: string;
}










