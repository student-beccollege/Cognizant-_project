import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiurl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient) {}

  register(userdata: any): Observable<any> {
    return this.http.post(`${this.apiurl}/register`, userdata);
  }

  login(userdata: any): Observable<any> {
    return this.http.post(`${this.apiurl}/login`, userdata).pipe(
      tap((res: any) => {
        if (res?.username) {
          localStorage.setItem('userId', String(res.id));
          localStorage.setItem('username', res.username);
          localStorage.setItem('role', res.role);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiurl}/logout`, {});
  }

  me(): Observable<any> {
    return this.http.get(`${this.apiurl}/me`);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('username');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
