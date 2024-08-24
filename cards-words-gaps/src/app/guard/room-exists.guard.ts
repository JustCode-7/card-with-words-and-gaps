import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from "@angular/router";
import {inject} from "@angular/core";
import {BackendService} from "../service/backend.service";
import {catchError, map, of, tap} from "rxjs";

export const canActivateGameGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router)
  return inject(BackendService)
    .getRoom(route.params['room'])
    .pipe(
      map(() => true),
      catchError(() => of(false)),
      tap(canActivate => {
        console.log('canActivate', canActivate)
        if (!canActivate) router.navigate(['/join-game'])
      })
    )
};
