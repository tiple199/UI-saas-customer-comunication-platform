/**
 * Lightweight STOMP 1.2 over Native WebSocket client.
 * Kết nối trực tiếp tới Spring WebSocket STOMP endpoint (/ws) mà không cần cài thêm thư viện ngoài.
 */

type MessageCallback<T = any> = (payload: T) => void;

interface SubscriptionEntry {
  id: string;
  destination: string;
  callback: MessageCallback;
}

class StompWebSocketClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private connecting = false;
  private subCounter = 0;
  private subscriptions = new Map<string, SubscriptionEntry>();
  private reconnectTimer: number | null = null;

  private getWsUrl(): string {
    const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (envBase && envBase.startsWith('http')) {
      return envBase.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Nếu đang chạy Vite dev ở cổng 3000, kết nối thẳng tới cổng 8080 của Spring Boot
    if (window.location.port === '3000') {
      return `${protocol}//${window.location.hostname}:8080/ws`;
    }
    return `${protocol}//${window.location.host}/ws`;
  }

  private ensureConnected() {
    if (this.connected || this.connecting) {
      return;
    }
    this.connecting = true;

    try {
      const ws = new WebSocket(this.getWsUrl());
      this.ws = ws;

      ws.onopen = () => {
        // Gửi frame STOMP CONNECT
        const connectFrame = 'CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\0';
        ws.send(connectFrame);
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        this.handleRawData(event.data);
      };

      ws.onclose = () => {
        this.connected = false;
        this.connecting = false;
        this.ws = null;
        if (this.subscriptions.size > 0 && !this.reconnectTimer) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.ensureConnected();
          }, 2500);
        }
      };

      ws.onerror = () => {
        // onclose sẽ xử lý tự động kết nối lại
      };
    } catch {
      this.connecting = false;
    }
  }

  private handleRawData(rawData: string) {
    // Một gói dữ liệu có thể chứa nhiều STOMP frame ngăn cách bởi ký tự NULL (\0)
    const frames = rawData.split('\0');
    for (const rawFrame of frames) {
      const trimmed = rawFrame.replace(/^\n+/, '');
      if (!trimmed) continue;

      const headerBodySplit = trimmed.indexOf('\n\n');
      if (headerBodySplit === -1) continue;

      const headerPart = trimmed.substring(0, headerBodySplit);
      const bodyPart = trimmed.substring(headerBodySplit + 2);
      const lines = headerPart.split('\n');
      const command = lines[0]?.trim();

      const headers: Record<string, string> = {};
      for (let i = 1; i < lines.length; i++) {
        const idx = lines[i].indexOf(':');
        if (idx > 0) {
          const k = lines[i].substring(0, idx).trim();
          const v = lines[i].substring(idx + 1).trim();
          headers[k] = v;
        }
      }

      if (command === 'CONNECTED') {
        this.connected = true;
        this.connecting = false;
        // Đăng ký lại toàn bộ các subscription hiện có
        for (const sub of this.subscriptions.values()) {
          this.sendSubscribeFrame(sub.id, sub.destination);
        }
      } else if (command === 'MESSAGE') {
        const subId = headers['subscription'];
        const destination = headers['destination'];
        let parsed: any = bodyPart;
        try {
          parsed = JSON.parse(bodyPart);
        } catch {
          // giữ nguyên chuỗi nếu không phải JSON
        }

        if (subId && this.subscriptions.has(subId)) {
          this.subscriptions.get(subId)?.callback(parsed);
        } else if (destination) {
          for (const sub of this.subscriptions.values()) {
            if (sub.destination === destination) {
              sub.callback(parsed);
            }
          }
        }
      }
    }
  }

  private sendSubscribeFrame(id: string, destination: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
      const frame = `SUBSCRIBE\nid:${id}\ndestination:${destination}\n\n\0`;
      this.ws.send(frame);
    }
  }

  private sendUnsubscribeFrame(id: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
      const frame = `UNSUBSCRIBE\nid:${id}\n\n\0`;
      this.ws.send(frame);
    }
  }

  public subscribe<T = any>(destination: string, callback: MessageCallback<T>): () => void {
    const id = `sub-${++this.subCounter}`;
    this.subscriptions.set(id, { id, destination, callback });

    this.ensureConnected();
    if (this.connected) {
      this.sendSubscribeFrame(id, destination);
    }

    return () => {
      this.sendUnsubscribeFrame(id);
      this.subscriptions.delete(id);
    };
  }
}

export const stompWsClient = new StompWebSocketClient();
