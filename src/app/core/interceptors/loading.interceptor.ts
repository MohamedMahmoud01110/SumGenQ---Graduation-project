import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {

  const spinner = inject (NgxSpinnerService)
  const loadingService = inject(LoadingService);

  spinner.show();
  loadingService.show();

  return next(req).pipe(finalize(() => {
    spinner.hide();
    loadingService.hide();

  }));
};
