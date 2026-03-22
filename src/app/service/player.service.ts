import {Injectable} from '@angular/core';
import {v4 as uuidv4} from 'uuid';
import {Player} from "../model/Player";

@Injectable({providedIn: 'root'})
export class PlayerService {

  constructor() {
    if (!localStorage.getItem('playerId')) {
      localStorage.setItem('playerId', uuidv4());
    }
  }

  public setName(name: string): void {
    if (name && name !== 'undefined' && name !== 'null') {
      const oldName = localStorage.getItem('playerName');
      console.log(`[DEBUG_LOG] PlayerService: Setting name from "${oldName}" to "${name}".`);
      if (name === 'Karl' || name === 'Jenny' || name === 'lord') {
        console.trace("[DEBUG_LOG] PlayerService: Name trace for " + name);
      }
      localStorage.setItem('playerName', name);
    }
  }

  public getPlayer(): Player {
    return {
      id: localStorage.getItem('playerId')!,
      name: localStorage.getItem('playerName')!,
    };
  }

}
