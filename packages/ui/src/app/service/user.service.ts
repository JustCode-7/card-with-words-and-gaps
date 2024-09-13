import {Injectable} from '@angular/core';
import {v4 as uuidv4} from 'uuid';
import {Player} from "@cards-with-words-and-gaps/shared/dist/model/player";

@Injectable({providedIn: 'root'})
export class UserService {

  constructor() {
    if (!localStorage.getItem('playerId')) {
      localStorage.setItem('playerId', uuidv4());
    }
  }

  public setName(name: string): void {
    localStorage.setItem('playerName', name);
  }

  public getUser(): Player {
    return {
      id: localStorage.getItem('playerId')!,
      name: localStorage.getItem('playerName')!,
    };
  }

}
