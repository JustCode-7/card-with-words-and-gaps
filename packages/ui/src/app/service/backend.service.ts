import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";
import {Card} from "@cards-with-words-and-gaps/shared/dist/model/card";
import {Room} from "@cards-with-words-and-gaps/shared/dist/model/room";

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
