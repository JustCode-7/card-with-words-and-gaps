import {ResolveFn} from '@angular/router';
import {BackendService} from "../service/backend.service";
import {inject} from "@angular/core";
import {catchError, Observable, of, tap} from "rxjs";
import {DataService} from "../service/data.service";

export const roomListResolver: ResolveFn<Observable<string[]>> = (route, state) => {

    const backend = inject(BackendService)
    const data = inject(DataService)

    return backend
        .getRoomIdList()
        .pipe(
            tap(roomList => data.roomListSignal.set(roomList)),
            catchError(err => {
                console.warn("Backend nicht erreichbar oder P2P-Modus aktiv. Raumliste wird übersprungen.", err);
                data.roomListSignal.set([]);
                return of([]);
            })
        );
};
