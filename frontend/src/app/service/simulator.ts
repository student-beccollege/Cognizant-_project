import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {
  // Use the base URL without specific controller paths
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) { }

  getPipesByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pipes/user/${userId}`);
  }

  addPipe(userId: string, pipeName: string, location: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pipes/add/${userId}`, { pipeName, location });
  }

  // Matches @RequestMapping("/api/simulator") -> @PostMapping("/start/{userId}")
  start(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulator/start/${userId}`, {});
  }

  // Matches @RequestMapping("/api/simulator") -> @PostMapping("/stop/{userId}")
  stop(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/simulator/stop/${userId}`, {});
  }

  // Matches @RequestMapping("/api/simulator") -> @GetMapping("/history/{userId}")
  getUserHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/simulator/history/${userId}`);
  }

  // Matches @RequestMapping("/api/simulator") -> @GetMapping("/latest/{userId}")
  getUserLatest(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/simulator/latest/${userId}`);
  }

  // Get the latest reading for a specific pipe (used when a pipe is selected in the dropdown)
  getPipeLatest(pipeId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/simulator/latest/pipe/${pipeId}`);
  }

  // Get all historical readings for a specific pipe (fills the chart on pipe change)
  getPipeHistory(pipeId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/simulator/history/pipe/${pipeId}`);
  }
}
