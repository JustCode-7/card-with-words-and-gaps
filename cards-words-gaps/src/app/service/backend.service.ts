import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class BackendService {

  private http = inject(HttpClient);

  // Use same-origin relative path so Angular dev-server proxy can forward to backend
  getRoomIdList() {
    return this.http.get<string[]>(`/rooms`);
  }
}
