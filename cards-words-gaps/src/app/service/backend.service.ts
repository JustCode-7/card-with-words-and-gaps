import {inject, Injectable} from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class BackendService {

  private readonly serverUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  getRoomIdList() {
    return this.http.get<string[]>(`${this.serverUrl}/rooms`)
  }
}
