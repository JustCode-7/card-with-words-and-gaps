import {Injectable, signal} from '@angular/core';

@Injectable({providedIn: 'root'})
export class DataService {

  public roomListSignal = signal<string[]>([])
}
