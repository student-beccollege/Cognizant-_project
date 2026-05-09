import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) { }

  getPipesByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pipes/user/${userId}`);
  }

  addPipe(userId: string, pipeName: string, location: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pipes/add/${userId}`, { pipeName, location });
  }

  start(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulator/start/${userId}`, {});
  }

  stop(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulator/stop/${userId}`, {});
  }

  getPipeLatest(pipeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/simulator/latest/pipe/${pipeId}`);
  }

  getPipeHistory(pipeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/simulator/history/pipe/${pipeId}`);
  }

  getAlerts(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/simulator/alerts/${userId}`);
  }
}
