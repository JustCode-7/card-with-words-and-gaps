import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';

export const nameGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const playername = route.params['playername'];
  if (!playername) {
    router.navigate(['/set-name']);
    return false;
  } else {
    return true;
  }
};
