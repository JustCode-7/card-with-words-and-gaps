import {Injectable} from '@angular/core';
import {v4 as uuidv4} from 'uuid';

@Injectable({providedIn: 'root'})
export class PlayerService {

  constructor() {
    if (!localStorage.getItem('playerId')) {
      localStorage.setItem('playerId', uuidv4());
    }
  }

  public setName(name: string): void {
    localStorage.setItem('playerName', name);
  }

  public getPlayer() {
    return {
      id: localStorage.getItem('playerId')!,
      name: localStorage.getItem('playerName')!,
    };
  }

}
