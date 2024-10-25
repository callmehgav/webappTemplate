import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private webSocket: WebSocket | undefined;
  public connectionStatus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false); // To track connection status

  constructor() {}

  connect() {
    this.webSocket = new WebSocket(environment.wsUrl);

    this.webSocket.onopen = (event) => {
      console.log('WebSocket connection opened:', event);
      this.connectionStatus.next(true);  // Update connection status to "connected"
    };

    this.webSocket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    this.webSocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      this.connectionStatus.next(false);  // Update connection status to "disconnected"
    };

    this.webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionStatus.next(false);  // Set status to "disconnected" on error
    };
  }

  sendMessage(content: string, messageType: string = 'frontendMsg') {
    const message = {
      Type: messageType,   // Define the type of the message (e.g., frontendMsg)
      Payload: content     // The actual message content
    };

    if (this.webSocket?.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));  // Send the message as JSON
    } else {
      console.error('WebSocket is not open');
    }
}

  close() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
}
