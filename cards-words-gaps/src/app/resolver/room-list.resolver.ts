import {ResolveFn} from '@angular/router';
import {BackendService} from "../service/backend.service";
import {inject} from "@angular/core";
import {Observable, tap} from "rxjs";
import {DataService} from "../service/data.service";

export const roomListResolver: ResolveFn<Observable<string[]>> = (route, state) => {

  const backend = inject(BackendService)
  const data = inject(DataService)

  return backend
    .getRoomIdList()
    .pipe(
      tap(roomList => data.roomListSignal.set(roomList))
    );
};
