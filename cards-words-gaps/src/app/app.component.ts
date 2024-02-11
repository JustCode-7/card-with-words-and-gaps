import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {GapTextCardComponent} from "./components/gap-text-card/gap-text-card.component";
import {AnswerTextCardComponent} from "./components/answer-text-card/answer-text-card.component";
import {MYAction, SocketEvent} from "./util/client-enums";
import {Message, SocketService} from "./service/socket.service";
import {HttpClientModule} from "@angular/common/http";
import {Spieler} from "./modal/spieler-model";
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatCardModule,
    MatButtonModule,
    GapTextCardComponent,
    AnswerTextCardComponent,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  messages: Message[] = [];
  user: Spieler | undefined;
  messageContent: null | undefined;
  clientUuid = uuidv4();

  constructor(private socketService: SocketService) {
  }

  ngOnInit(): void {
    // this.user = new Spieler("dude", 1, [], [], false)
    this.initIoConnection();
    //this.sendMessage("Hallo to Client : " + this.clientUuid)
  }

  private initIoConnection(): void {
    this.socketService.initSocket();
    this.listenOnEvents()

  }

  private listenOnEvents(): void {
    this.socketService.onMessage()
      .subscribe((message: Message) => {
        this.messages.push(message);
      });

    this.socketService.onEvent(SocketEvent.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });

    this.socketService.onEvent(SocketEvent.RECONNECT)
      .subscribe(() => {
        console.log('reconnection');
      });

    this.socketService.onEvent(SocketEvent.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });
  }

  public sendMessage(message: string): void {
    if (!message) {
      return;
    }

    this.socketService.send({
      from: this.user,
      content: message
    });
    this.messageContent = null;
  }

  public sendNotification(params: any, action: MYAction): void {
    let message: Message;

    if (action === MYAction.JOINED) {
      message = {
        from: this.user,
        action: action
      }
    } else if (action === MYAction.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user?.name,
          previousUsername: params.previousUsername
        }
      };
    }

    // @ts-ignore
    this.socketService.send(message);
  }
}
