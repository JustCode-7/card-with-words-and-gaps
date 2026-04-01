import {Component, inject, OnInit, signal} from '@angular/core';
import {RoomCreateComponent} from "../../components/room-create/room-create.component";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {SocketService} from "../../service/socket.service";
import {MatchService} from "../../service/match.service";
import {WebRTCService} from "../../service/webrtc.service";
import {CommonModule} from "@angular/common";
import {WebRTCMode} from "../../service/webrtc.types";

@Component({
  selector: 'app-new-game-page',
  standalone: true,
  imports: [
    RoomCreateComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './new-game-page.component.html',
})
export class NewGamePage implements OnInit {
  roomIdControl = new FormControl('', [Validators.required, Validators.maxLength(32)]);
  selectedMode = signal<'online' | 'local'>('online');
  isCreating = signal(false);
  errorMessage = signal<string | null>(null);
  roomNameParam = signal<string | null>(null);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private socketService = inject(SocketService);
  private matchService = inject(MatchService);
  private webrtcService = inject(WebRTCService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.roomNameParam.set(params['room'] || null);
    });
  }

  async createRoom() {
    if (this.roomIdControl.invalid) return;
    this.isCreating.set(true);
    this.errorMessage.set(null);

    const room = this.roomIdControl.value!;
    const mode = this.selectedMode();

    try {
      this.webrtcService.mode.set(mode === 'online' ? WebRTCMode.ONLINE : WebRTCMode.LOCAL);

      // Falls Online-Modus: Initialisiere Hosting über Firebase
      if (mode === 'online') {
        console.log("[DEBUG_LOG] NewGamePage: Starting Online Hosting for", room);
        await this.webrtcService.startOnlineHosting(room);
      }

      // Socket & Match initialisieren
      this.socketService.setP2PRoomId(room);
      this.socketService.isHost.set(true);
      this.socketService.createRoom(room);
      this.matchService.initMatch(room);

      // Navigiere mit dem Raum-Parameter
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {room: room},
        queryParamsHandling: 'merge'
      });
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Fehler beim Erstellen des Raums');
      this.isCreating.set(false);
    }
  }
}
