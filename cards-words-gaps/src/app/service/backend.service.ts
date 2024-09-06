import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Player} from "../model/player";
import {Room} from "../model/room";
import {Card} from "../model/card";

interface CatlordPayload {
  catlord: Player
}

interface GapCardPayload {
  gapCard: Card
}

@Injectable({providedIn: 'root'})
export class BackendService {

  private readonly serverUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  getRoomIdList() {
    return this.http.get<string[]>(`${this.serverUrl}/room`)
  }

  getRoom(roomId: string) {
    return this.http.get<Room>(`${this.serverUrl}/room/${roomId}`)
  }

  getPlayers(roomId: string) {
    return this.http.get<Player[]>(`${this.serverUrl}/room/${roomId}/players`)
  }

  getCatlord(roomId: string) {
    return this.http.get<CatlordPayload>(`${this.serverUrl}/room/${roomId}/catlord`)
  }

  getGapCard(roomId: string) {
    return this.http.get<GapCardPayload>(`${this.serverUrl}/room/${roomId}/gap-card`)
  }

}
