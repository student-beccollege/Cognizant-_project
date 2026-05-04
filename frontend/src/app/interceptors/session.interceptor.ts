import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    console.log('🔍 SessionInterceptor is intercepting:', request.url);

    request = request.clone({
      withCredentials: true
    });

    console.log('✅ withCredentials set to true');

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          console.log('✅ Response received:', event.status);
        }
      }),
      catchError(error => {
        console.error('❌ Error:', error.status, error.message);
        return throwError(() => error);
      })
    );
  }
}
