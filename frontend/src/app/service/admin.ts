import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = 'http://localhost:8081/api/admin';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/users`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.api}/users/${id}`);
  }

  getAllPipes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/pipes`);
  }

updatePipe(id: number, pipe: any): Observable<any> {
    return this.http.put(`${this.api}/pipes/${id}`, pipe);
  }

  deletePipe(id: number): Observable<any> {
    return this.http.delete(`${this.api}/pipes/${id}`);
  }

  getAllReadings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/readings`);
  }
}
