import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {RouterLink} from "@angular/router";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatSelectModule} from "@angular/material/select";
import {AsyncPipe, NgForOf} from "@angular/common";
import {InputHelperService} from "../../service/input-helper.service";
import {MatchService} from "../../service/match.service";
import {SocketService} from "../../service/socket.service";

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatPaginatorModule,
    MatSelectModule,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './new-game-page.component.html',
  styleUrl: './new-game-page.component.scss'
})
export class NewGamePageComponent implements OnInit {
  playerName = "";
  roomName = "";

  socketService: SocketService = inject(SocketService);

  constructor(public readonly inputHelper: InputHelperService,
              protected readonly matchService: MatchService) {
  }

  ngOnInit(): void {
    this.matchService.initIoConnection();
  }

  submitConfig(playerName: string) {
    this.socketService.joinRoom(this.roomName)
  }


}
