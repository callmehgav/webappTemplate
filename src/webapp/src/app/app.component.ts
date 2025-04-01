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
  imageList: string[] = [];

  ngOnInit(): void {
    this.webSocketService.connect();
  
    this.webSocketService.connectionStatus.subscribe(status => {
      this.isConnected = status;
    });
  
    // Add the image paths here (match file names in your ./data folder)
    this.imageList = [
      'http://localhost:5000/images/lemon.jpg'
    ];
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
