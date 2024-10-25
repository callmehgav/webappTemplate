import { Component, OnInit } from '@angular/core';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  message: string = '';
  messageLog: string[] = [];
  isConnected: boolean = false;  // Track if the connection is active

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    // Connect to the WebSocket server on initialization
    this.webSocketService.connect();

    // Subscribe to connection status changes
    this.webSocketService.connectionStatus.subscribe(status => {
      this.isConnected = status;
    });
  }

  sendMessage() {
    if (this.message.trim()) {
      this.webSocketService.sendMessage(this.message);
      this.messageLog.push(`You: ${this.message}`);
      this.message = '';
    }
  }

  closeConnection() {
    this.webSocketService.close();
  }
}
