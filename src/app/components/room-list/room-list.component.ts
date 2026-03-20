import {Component, inject, OnInit, signal} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {DataService} from "../../service/data.service";
import {MatCardModule} from "@angular/material/card";
import {ActivatedRoute, Router} from "@angular/router";
import {PlayerService} from "../../service/player.service";
import {SocketService} from "../../service/socket.service";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {AsyncPipe} from "@angular/common";
import {MatTooltip} from "@angular/material/tooltip";

@Component({
  selector: 'app-room-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AsyncPipe,
    MatTooltip
  ],
  templateUrl: './room-list.component.html',
  styles: `
    .mw-50 {
      max-width: 50%;
    }

    .room-card {
      margin-bottom: 1rem;
    }

    .room-name {
      margin-right: 1rem;
      font-weight: bold;
    }

    .w-100 {
      width: 100%;
    }

    .mb-3 {
      margin-bottom: 1rem;
    }

    .mb-4 {
      margin-bottom: 1.5rem;
    }

    .mt-3 {
      margin-top: 1rem;
    }

    .mt-2 {
      margin-top: 0.5rem;
    }

    .bg-success-subtle {
      background-color: #d1e7dd;
      color: #0f5132;
    }

    .bg-warning-subtle {
      background-color: #fff3cd;
      color: #664d03;
    }

    .bg-danger-subtle {
      background-color: #f8d7da;
      color: #842029;
    }

    .animation-pulse {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  `
})
export class RoomListComponent implements OnInit {
  webrtcService = inject(WebRTCService);
  offerCodeControl = new FormControl('', [Validators.required]);
  answerCode = signal('');
  answerQrCodeUrl = signal('');
  p2pRoomId = signal('P2P-Room');
  protected playerService = inject(PlayerService);
  private data = inject(DataService);
  rooms = this.data.roomListSignal;
  private socketService = inject(SocketService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);

  ngOnInit(): void {
    // Check for offer in URL
    this.route.queryParams.subscribe(params => {
      const offer = params['offer'];
      if (offer) {
        this.offerCodeControl.setValue(offer);
        this.generateAnswer();
      }
    });
  }

  async generateAnswer() {
    const offer = this.offerCodeControl.value;
    if (offer) {
      const {answer, roomId} = await this.webrtcService.createAnswer(offer);

      // WICHTIG: Erst den Raum-Namen setzen, bevor wir die Answer anzeigen
      // (da die Answer den Status 'connected' triggern kann)
      this.p2pRoomId.set(roomId);
      this.socketService.setP2PRoomId(roomId);

      this.answerCode.set(answer);
      const qr = await this.webrtcService.generateQRCode(answer);
      this.answerQrCodeUrl.set(qr);
    }
  }

  copyAnswer() {
    navigator.clipboard.writeText(this.answerCode());
  }

  finishJoin() {
    const roomId = this.p2pRoomId();
    const playerName = this.playerService.getPlayer().name;
    this.socketService.setP2PRoomId(roomId);
    this.matchService.initMatch(roomId);
    this.router.navigate(['/game', roomId, playerName, 'player']);
  }

  joinRoom(roomId: string) {
    const playerName = this.playerService.getPlayer().name;

    // Join the room through the socket
    this.socketService.joinRoom(roomId);

    // Initialize the match locally so the RoomGuard passes
    this.matchService.initMatch(roomId);

    // Navigate to the player page
    this.router.navigate(['/game', roomId, playerName, 'player']);
  }
}
