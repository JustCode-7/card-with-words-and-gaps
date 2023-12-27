import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputHelperService {

  constructor() { }

  validate($event: Event) {
    const regex = new RegExp('\\W');
    const value = ($event.target as HTMLInputElement).value;
    if(regex.test(value)){
      console.log(regex.test(value));
      ($event.target as HTMLInputElement).value = '';
    }
  }
}
