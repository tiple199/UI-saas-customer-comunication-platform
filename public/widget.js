/**
 * SaaS Customer Communication Platform - Embeddable Web Chat Widget
 * Tự động tạo nút chat nổi và khung hội thoại hỗ trợ khách hàng đa kênh (AI & Staff)
 */
(function () {
  'use strict';

  // 1. Xác định cấu hình từ thẻ <script>
  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-channel-key')) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!scriptTag) {
    console.error('[SaaS Chat Widget] Không tìm thấy thẻ script có thuộc tính data-channel-key!');
    return;
  }

  var channelKey = scriptTag.getAttribute('data-channel-key') || '';
  // Mặc định kết nối tới Backend Spring Boot port 8080 nếu không cấu hình data-api-base
  var apiBase = scriptTag.getAttribute('data-api-base') || 'http://localhost:8080';

  if (!channelKey) {
    console.error('[SaaS Chat Widget] data-channel-key không được để trống!');
    return;
  }

  // Khóa lưu token khách hàng trên trình duyệt
  var STORAGE_TOKEN_KEY = 'saas_chat_visitor_token_' + channelKey;

  // Trạng thái Widget
  var state = {
    isOpen: false,
    channelConfig: null,
    visitorToken: localStorage.getItem(STORAGE_TOKEN_KEY) || '',
    conversation: null,
    messages: [],
    loading: false,
    sending: false,
    ws: null,
    wsConnected: false,
    wsSubscribedConvId: null,
    isThinking: false,
    lastRenderedSignature: ''
  };

  // 2. Chèn CSS cách ly, thiết kế hiện đại (Crisp / Intercom style)
  var style = document.createElement('style');
  style.id = 'saas-chat-widget-styles';
  style.textContent = `
    .saas-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      box-sizing: border-box;
    }
    .saas-widget-container * {
      box-sizing: border-box;
    }
    /* Nút chat tròn nổi */
    .saas-widget-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(22, 119, 255, 0.4);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s;
      border: none;
      outline: none;
      position: relative;
    }
    .saas-widget-fab:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 24px rgba(22, 119, 255, 0.5);
    }
    .saas-widget-fab:active {
      transform: scale(0.95);
    }
    .saas-widget-fab svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
      transition: transform 0.2s;
    }
    /* Cửa sổ chat */
    .saas-widget-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 580px;
      max-height: calc(100vh - 120px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.16), 0 2px 10px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: scale(0.85) translateY(20px);
      pointer-events: none;
      border: 1px solid rgba(226, 232, 240, 0.8);
      z-index: 2147483647;
    }
    .saas-widget-window.saas-open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }
    /* Header cửa sổ chat */
    .saas-widget-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    }
    .saas-widget-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .saas-widget-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .saas-widget-title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
    }
    .saas-widget-subtitle {
      font-size: 12px;
      opacity: 0.88;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
    }
    .saas-widget-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #52c41a;
      display: inline-block;
    }
    .saas-widget-close {
      background: transparent;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
      transition: opacity 0.15s, background 0.15s;
    }
    .saas-widget-close:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }
    /* Danh sách tin nhắn */
    .saas-widget-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .saas-message-item {
      display: flex;
      flex-direction: column;
      max-width: 82%;
    }
    .saas-message-item.saas-visitor {
      align-self: flex-end;
    }
    .saas-message-item.saas-bot, .saas-message-item.saas-staff {
      align-self: flex-start;
    }
    .saas-message-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .saas-message-item.saas-visitor .saas-message-bubble {
      background: #1677ff;
      color: #ffffff;
      border-bottom-right-radius: 3px;
    }
    .saas-message-item.saas-bot .saas-message-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 3px;
      border-left: 3px solid #722ed1;
    }
    .saas-message-item.saas-staff .saas-message-bubble {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 3px;
      border-left: 3px solid #1677ff;
    }
    .saas-message-sender-name {
      font-size: 11px;
      margin-bottom: 3px;
      font-weight: 600;
    }
    .saas-message-item.saas-bot .saas-message-sender-name {
      color: #722ed1;
    }
    .saas-message-item.saas-staff .saas-message-sender-name {
      color: #1677ff;
    }
    .saas-message-time {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 3px;
      text-align: right;
    }
    .saas-message-item.saas-visitor .saas-message-time {
      color: rgba(255, 255, 255, 0.8);
    }
    /* Typing indicator */
    .saas-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      width: fit-content;
      font-size: 12px;
      color: #722ed1;
      font-weight: 500;
      align-self: flex-start;
    }
    .saas-typing-dot {
      width: 5px;
      height: 5px;
      background: #722ed1;
      border-radius: 50%;
      animation: saasBounce 1.4s infinite ease-in-out both;
    }
    .saas-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .saas-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes saasBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    /* Thanh nhập tin nhắn */
    .saas-widget-footer {
      padding: 12px 14px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
    }
    .saas-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      border-radius: 24px;
      padding: 4px 6px 4px 14px;
      border: 1px solid transparent;
      transition: border 0.2s, background 0.2s;
    }
    .saas-input-box:focus-within {
      background: #ffffff;
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.15);
    }
    .saas-input-box textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      font-size: 13.5px;
      font-family: inherit;
      color: #1e293b;
      max-height: 80px;
      padding: 6px 0;
    }
    .saas-send-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #1677ff;
      color: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
    }
    .saas-send-btn:hover {
      background: #0958d9;
    }
    .saas-send-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }
    .saas-powered-by {
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      margin-top: 6px;
    }
  `;
  document.head.appendChild(style);

  // 3. Tạo cấu trúc DOM của Chat Widget
  var container = document.createElement('div');
  container.className = 'saas-widget-container';
  container.innerHTML = `
    <!-- Cửa sổ chat -->
    <div class="saas-widget-window" id="saas-chat-window">
      <div class="saas-widget-header">
        <div class="saas-widget-header-info">
          <div class="saas-widget-avatar">💬</div>
          <div>
            <div class="saas-widget-title" id="saas-header-title">Hỗ Trợ Khách Hàng</div>
            <div class="saas-widget-subtitle">
              <span class="saas-widget-dot"></span>
              <span id="saas-header-status">Trực tuyến</span>
            </div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="saas-widget-close" id="saas-reset-btn" title="Tạo cuộc trò chuyện mới" style="font-size:11px; padding:4px 8px; border:1px solid rgba(255,255,255,0.35); border-radius:12px;">
            ↻ Phiên mới
          </button>
          <button class="saas-widget-close" id="saas-close-btn" title="Đóng cửa sổ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="saas-widget-body" id="saas-messages-list">
        <!-- Danh sách tin nhắn sẽ render tại đây -->
      </div>
      <div class="saas-widget-footer">
        <div class="saas-input-box">
          <textarea id="saas-message-input" rows="1" placeholder="Nhập câu hỏi cần hỗ trợ..."></textarea>
          <button class="saas-send-btn" id="saas-send-btn" title="Gửi tin nhắn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div class="saas-powered-by">⚡ Powered by SaaS Customer Platform</div>
      </div>
    </div>

    <!-- Nút tròn nổi (Floating Action Button) -->
    <button class="saas-widget-fab" id="saas-fab-btn" title="Trò chuyện với chúng tôi">
      <svg id="saas-fab-open-icon" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
      <svg id="saas-fab-close-icon" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;
  document.body.appendChild(container);

  // DOM Elements
  var chatWindow = document.getElementById('saas-chat-window');
  var fabBtn = document.getElementById('saas-fab-btn');
  var closeBtn = document.getElementById('saas-close-btn');
  var resetBtn = document.getElementById('saas-reset-btn');
  var fabOpenIcon = document.getElementById('saas-fab-open-icon');
  var fabCloseIcon = document.getElementById('saas-fab-close-icon');
  var messagesList = document.getElementById('saas-messages-list');
  var messageInput = document.getElementById('saas-message-input');
  var sendBtn = document.getElementById('saas-send-btn');
  var headerTitle = document.getElementById('saas-header-title');
  var headerStatus = document.getElementById('saas-header-status');

  function updateHeaderStatusText() {
    if (!headerStatus) return;
    if (state.conversation && state.conversation.handlingMode === 'HUMAN') {
      headerStatus.innerText = state.conversation.assigneeId
        ? 'Nhân viên đang hỗ trợ bạn'
        : 'Đang chờ nhân viên hỗ trợ...';
    } else if (state.channelConfig && state.channelConfig.aiEnabled) {
      headerStatus.innerText = 'Trợ lý AI đang sẵn sàng';
    } else {
      headerStatus.innerText = 'Nhân viên trực tuyến';
    }
  }

  // Hàm toggle cửa sổ chat
  function toggleChat(forceOpen) {
    state.isOpen = typeof forceOpen === 'boolean' ? forceOpen : !state.isOpen;
    if (state.isOpen) {
      chatWindow.classList.add('saas-open');
      fabOpenIcon.style.display = 'none';
      fabCloseIcon.style.display = 'block';
      setTimeout(function () { messageInput.focus(); }, 150);
      if (!state.conversation) {
        initWidgetHandshake();
      } else {
        connectWebSocket();
      }
    } else {
      chatWindow.classList.remove('saas-open');
      fabOpenIcon.style.display = 'block';
      fabCloseIcon.style.display = 'none';
      disconnectWebSocket();
    }
  }

  fabBtn.addEventListener('click', function () { toggleChat(); });
  closeBtn.addEventListener('click', function () { toggleChat(false); });
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      disconnectWebSocket();
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      state.visitorToken = '';
      state.conversation = null;
      state.messages = [];
      state.isThinking = false;
      state.lastRenderedSignature = '';
      initWidgetHandshake();
    });
  }

  // Escape HTML tránh XSS
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.innerText = text || '';
    return div.innerHTML;
  }

  // Cuộn tin nhắn xuống đáy
  function scrollToBottom() {
    setTimeout(function () {
      messagesList.scrollTop = messagesList.scrollHeight;
    }, 60);
  }

  // Tạo phần tử DOM cho 1 tin nhắn đơn lẻ
  function createMessageElement(msg, domId) {
    var isVisitor = msg.senderType === 'VISITOR';
    var isAi = msg.senderType === 'AI';
    var typeClass = isVisitor ? 'saas-visitor' : (isAi ? 'saas-bot' : 'saas-staff');
    var senderLabel = isVisitor ? 'Bạn' : (isAi ? '🤖 Trợ lý AI' : '👤 Nhân viên hỗ trợ');
    var timeStr = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';

    var item = document.createElement('div');
    item.className = 'saas-message-item ' + typeClass;
    item.setAttribute('data-msg-id', String(domId));

    var inner = '';
    if (!isVisitor) {
      inner += '<div class="saas-message-sender-name">' + senderLabel + '</div>';
    }
    inner += '<div class="saas-message-bubble">' + escapeHtml(msg.content) + '</div>';
    inner += '<div class="saas-message-time">' + timeStr + '</div>';
    item.innerHTML = inner;
    return item;
  }

  // Render danh sách tin nhắn bằng cách chèn từng node DOM mới (Incremental DOM) - Tuyệt đối không ghi đè innerHTML gây nháy
  function renderMessages(forceReset) {
    if (forceReset || !messagesList.getAttribute('data-initialized')) {
      messagesList.innerHTML = '';
      messagesList.setAttribute('data-initialized', 'true');
    }

    var shouldScroll = false;

    // 1. Lời chào mở đầu từ Channel Config
    if (state.channelConfig && state.channelConfig.welcomeMessage) {
      if (!messagesList.querySelector('[data-msg-id="welcome"]')) {
        var welcomeEl = createMessageElement(
          { senderType: 'AI', content: state.channelConfig.welcomeMessage },
          'welcome'
        );
        messagesList.appendChild(welcomeEl);
        shouldScroll = true;
      }
    }

    // 2. Đảm bảo typing indicator luôn nằm ở cuối danh sách
    var typingBox = document.getElementById('saas-typing-box');
    if (!typingBox) {
      typingBox = document.createElement('div');
      typingBox.className = 'saas-typing-indicator';
      typingBox.id = 'saas-typing-box';
      typingBox.style.display = 'none';
      typingBox.innerHTML =
        '<span>🤖 Trợ lý AI đang suy nghĩ</span>' +
        '<span class="saas-typing-dot"></span>' +
        '<span class="saas-typing-dot"></span>' +
        '<span class="saas-typing-dot"></span>';
      messagesList.appendChild(typingBox);
    }

    // 3. Chỉ chèn thêm các tin nhắn chưa có trên DOM (giữ nguyên 100% các node tin nhắn cũ)
    state.messages.forEach(function (msg) {
      var domId = String(msg.id);
      var existingEl = messagesList.querySelector('[data-msg-id="' + domId + '"]');
      if (!existingEl) {
        var newEl = createMessageElement(msg, domId);
        messagesList.insertBefore(newEl, typingBox);
        shouldScroll = true;
      }
    });

    // 4. Ẩn / hiện trạng thái đang suy nghĩ mà không tạo lại node
    var prevDisplay = typingBox.style.display;
    var nextDisplay = state.isThinking ? 'flex' : 'none';
    if (prevDisplay !== nextDisplay) {
      typingBox.style.display = nextDisplay;
      shouldScroll = true;
    }

    if (shouldScroll) {
      scrollToBottom();
    }
  }

  // 4. API Handshake - Khởi tạo phiên kết nối
  function initWidgetHandshake() {
    state.loading = true;
    messagesList.removeAttribute('data-initialized');
    messagesList.innerHTML = `
      <div style="text-align:center; padding: 40px 0; color: #94a3b8; font-size: 13px;">
        Đang kết nối tới tổng đài hỗ trợ...
      </div>
    `;

    fetch(apiBase + '/api/v1/public/widget/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelKey: channelKey,
        visitorToken: state.visitorToken || undefined
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        state.loading = false;
        if (res && res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          var data = res.data;
          state.channelConfig = {
            name: data.channelName,
            welcomeMessage: data.welcomeMessage,
            aiEnabled: data.aiEnabled
          };
          state.visitorToken = data.visitorToken;
          localStorage.setItem(STORAGE_TOKEN_KEY, data.visitorToken);

          if (headerTitle) {
            headerTitle.innerText = data.channelName || 'Hỗ Trợ Khách Hàng';
          }
          if (headerStatus) {
            headerStatus.innerText = data.aiEnabled ? 'Trợ lý AI đang sẵn sàng' : 'Nhân viên trực tuyến';
          }

          restoreConversation();
        } else {
          messagesList.innerHTML = `
            <div style="text-align:center; padding: 30px 10px; color: #ef4444; font-size: 13px;">
              ${escapeHtml((res && res.message) || 'Không thể kết nối đến kênh hỗ trợ.')}
            </div>
          `;
        }
      })
      .catch(function (err) {
        state.loading = false;
        console.error('[SaaS Chat Widget] Lỗi Handshake:', err);
        messagesList.innerHTML = `
          <div style="text-align:center; padding: 30px 10px; color: #ef4444; font-size: 13px;">
            Lỗi kết nối tới máy chủ (${escapeHtml(apiBase)}). Vui lòng kiểm tra lại cấu hình mạng.
          </div>
        `;
      });
  }

  // 5. Khôi phục lịch sử tin nhắn
  function restoreConversation() {
    if (!state.visitorToken) return;

    fetch(apiBase + '/api/v1/public/widget/conversations/restore?channelKey=' + encodeURIComponent(channelKey) + '&visitorToken=' + encodeURIComponent(state.visitorToken))
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res && res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          state.conversation = res.data.conversation;
          var newMsgs = res.data.messages || [];

          updateHeaderStatusText();

          // Tắt trạng thái thinking nếu tin nhắn cuối cùng là từ AI / STAFF hoặc hội thoại đã chuyển sang HUMAN
          var lastMsg = newMsgs.length > 0 ? newMsgs[newMsgs.length - 1] : null;
          if (
            (lastMsg && lastMsg.senderType !== 'VISITOR') ||
            (state.conversation && state.conversation.handlingMode === 'HUMAN')
          ) {
            state.isThinking = false;
          }

          state.messages = newMsgs;
          renderMessages(false);
          connectWebSocket();
        }
      })
      .catch(function (err) {
        console.warn('[SaaS Chat Widget] Lỗi khôi phục hội thoại:', err);
      });
  }

  // Kiểm tra thông minh chỉ khi đang chờ AI trả lời (tự dừng ngay khi nhận được câu trả lời, không lặp vô hạn)
  function scheduleAiReplyCheck(delays) {
    delays.forEach(function (ms) {
      setTimeout(function () {
        if (state.isOpen && state.isThinking && state.visitorToken) {
          restoreConversation();
        }
      }, ms);
    });
  }

  // 6. Gửi tin nhắn từ khách hàng
  function sendMessage() {
    var text = (messageInput.value || '').trim();
    if (!text || state.sending) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    state.sending = true;
    sendBtn.disabled = true;

    // Hiển thị tạm thời tin nhắn của khách hàng trên giao diện
    var tempMsg = {
      id: 'temp_' + Date.now(),
      senderType: 'VISITOR',
      content: text,
      createdAt: new Date().toISOString()
    };
    state.messages.push(tempMsg);

    // Chỉ bật trạng thái AI đang suy nghĩ nếu hội thoại đang ở chế độ AI
    var isAiMode = state.conversation
      ? state.conversation.handlingMode === 'AI'
      : Boolean(state.channelConfig && state.channelConfig.aiEnabled);
    state.isThinking = isAiMode;
    renderMessages(false);

    fetch(apiBase + '/api/v1/public/widget/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelKey: channelKey,
        visitorToken: state.visitorToken,
        content: text,
        messageType: 'TEXT'
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        state.sending = false;
        sendBtn.disabled = false;
        if (res && res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          // Thay thế tempMsg bằng tin nhắn thật từ server ngay trên node DOM hiện tại
          var realMsg = res.data;
          var tempEl = messagesList.querySelector('[data-msg-id="' + tempMsg.id + '"]');
          if (tempEl) {
            var existingRealEl = messagesList.querySelector('[data-msg-id="' + realMsg.id + '"]');
            if (existingRealEl) {
              tempEl.remove();
            } else {
              tempEl.setAttribute('data-msg-id', String(realMsg.id));
            }
          }
          var idx = state.messages.findIndex(function (m) { return m.id === tempMsg.id; });
          if (idx !== -1) {
            var alreadyExists = state.messages.some(function (m) { return m.id === realMsg.id; });
            if (alreadyExists) {
              state.messages.splice(idx, 1);
            } else {
              state.messages[idx] = realMsg;
            }
          }
          renderMessages(false);
          // Nếu đang chờ AI trả lời mà WebSocket chưa kịp đẩy về (ví dụ mở từ file:// bị chặn WS CORS), tự động lấy câu trả lời của AI và dừng ngay khi nhận được
          if (state.isThinking) {
            scheduleAiReplyCheck([1800, 3500, 6000, 10000]);
          }
        } else {
          state.isThinking = false;
          renderMessages(false);
          alert((res && res.message) || 'Gửi tin nhắn thất bại.');
        }
      })
      .catch(function (err) {
        state.sending = false;
        state.isThinking = false;
        sendBtn.disabled = false;
        console.error('[SaaS Chat Widget] Lỗi gửi tin nhắn:', err);
        alert('Lỗi kết nối khi gửi tin nhắn.');
      });
  }

  // Auto-resize textarea khi gõ
  messageInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  // Nhấn Enter để gửi (Shift+Enter để xuống dòng)
  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', function () {
    sendMessage();
  });

  // 7. Kết nối WebSocket STOMP realtime nhận tin nhắn mới từ AI / Staff (không cần HTTP polling)
  function getWsUrl() {
    return apiBase.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
  }

  function connectWebSocket() {
    if (!state.conversation || !state.conversation.id) return;
    var convId = state.conversation.id;
    if (state.ws && state.wsConnected && state.wsSubscribedConvId === convId) {
      return;
    }

    disconnectWebSocket();

    try {
      var ws = new WebSocket(getWsUrl());
      state.ws = ws;

      ws.onopen = function () {
        ws.send('CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0');
      };

      ws.onmessage = function (event) {
        if (typeof event.data !== 'string') return;
        var frames = event.data.split('\0');
        for (var i = 0; i < frames.length; i++) {
          var rawFrame = frames[i].replace(/^\n+/, '');
          if (!rawFrame) continue;
          var splitIdx = rawFrame.indexOf('\n\n');
          if (splitIdx === -1) continue;

          var headerPart = rawFrame.substring(0, splitIdx);
          var bodyPart = rawFrame.substring(splitIdx + 2);
          var lines = headerPart.split('\n');
          var command = (lines[0] || '').trim();

          if (command === 'CONNECTED') {
            state.wsConnected = true;
            state.wsSubscribedConvId = convId;
            ws.send('SUBSCRIBE\nid:sub-msg-' + convId + '\ndestination:/topic/conversations/' + convId + '\n\n\0');
            ws.send('SUBSCRIBE\nid:sub-status-' + convId + '\ndestination:/topic/conversations/' + convId + '/status\n\n\0');
          } else if (command === 'MESSAGE' && bodyPart) {
            try {
              var payload = JSON.parse(bodyPart);
              // Nếu là gói cập nhật trạng thái Conversation (handlingMode / status)
              if (payload && payload.handlingMode && !payload.senderType) {
                state.conversation = payload;
                updateHeaderStatusText();
                if (payload.handlingMode === 'HUMAN') {
                  state.isThinking = false;
                  renderMessages(false);
                }
              } else if (payload && payload.id && payload.senderType) {
                // Nếu là tin nhắn VISITOR mà đang có tempMsg trên DOM thì cập nhật ID trực tiếp để không tạo node thứ 2
                if (payload.senderType === 'VISITOR') {
                  var tempIdx = state.messages.findIndex(function (m) {
                    return String(m.id).indexOf('temp_') === 0 && m.content === payload.content;
                  });
                  if (tempIdx !== -1) {
                    var tempDomEl = messagesList.querySelector('[data-msg-id="' + state.messages[tempIdx].id + '"]');
                    if (tempDomEl) {
                      tempDomEl.setAttribute('data-msg-id', String(payload.id));
                    }
                    state.messages[tempIdx] = payload;
                  }
                }
                // Nếu là tin nhắn mới (AI / STAFF / VISITOR)
                var exists = state.messages.some(function (m) { return m.id === payload.id; });
                if (!exists) {
                  state.messages.push(payload);
                }
                if (payload.senderType !== 'VISITOR') {
                  state.isThinking = false;
                }
                renderMessages(false);
              }
            } catch (e) {
              // ignore parse error
            }
          }
        }
      };

      ws.onclose = function () {
        state.wsConnected = false;
        state.wsSubscribedConvId = null;
        state.ws = null;
        if (state.isOpen && state.conversation && state.conversation.id) {
          setTimeout(function () {
            if (state.isOpen) connectWebSocket();
          }, 3000);
        }
      };
    } catch (e) {
      console.warn('[SaaS Chat Widget] Không thể khởi tạo WebSocket:', e);
    }
  }

  function disconnectWebSocket() {
    if (state.ws) {
      try {
        state.ws.close();
      } catch (e) {}
      state.ws = null;
    }
    state.wsConnected = false;
    state.wsSubscribedConvId = null;
  }

  console.log('[SaaS Chat Widget] Đã khởi tạo thành công Widget cho channelKey: ' + channelKey);
})();

