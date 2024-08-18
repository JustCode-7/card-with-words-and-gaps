import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Player} from "../model/player";

@Injectable({providedIn: 'root'})
export class BackendService {

  private readonly serverUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  getRoomIdList() {
    return this.http.get<string[]>(`${this.serverUrl}/rooms`)
  }

  getPlayers(roomId: string) {
    return this.http.get<Player[]>(`${this.serverUrl}/room/${roomId}/players`)
  }
}
