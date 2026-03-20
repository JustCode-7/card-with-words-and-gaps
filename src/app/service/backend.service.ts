import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Observable} from "rxjs";

@Injectable({providedIn: 'root'})
export class BackendService {

  private http = inject(HttpClient);
  private apiUrl = environment.backendUrl;

  // Use same-origin relative path so Angular dev-server proxy can forward to backend
  getRoomIdList() {
    if (!this.apiUrl) {
      // Im P2P-Modus ohne Backend schmeißen wir keinen Fehler, sondern geben ein leeres Array zurück
      return new Observable<string[]>(obs => {
        obs.next([]);
        obs.complete();
      });
    }
    return this.http.get<string[]>(`${this.apiUrl}/rooms`);
  }
}
