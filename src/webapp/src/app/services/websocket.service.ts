import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private webSocket: WebSocket = new WebSocket("");

  constructor() {}

  connect() {
    this.webSocket = new WebSocket(environment.wsUrl);
    this.webSocket.onopen = (event) => console.log('WebSocket connection opened:', event);
    this.webSocket.onmessage = (event) => console.log('Message from server:', event.data);
    this.webSocket.onclose = (event) => console.log('WebSocket connection closed:', event);
    this.webSocket.onerror = (error) => console.error('WebSocket error:', error);
  }

  sendMessage(message: string) {
    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(message);
    } else {
      console.error('WebSocket is not open.');
    }
  }

  close() {
    this.webSocket?.close();
  }
}
