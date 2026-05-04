import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SimulatorService {

  // Ensure this matches your Spring Boot server port
  private baseUrl = 'http://localhost:8081/api/simulator';

  constructor(private http: HttpClient) {}

  /**
   * Starts the simulation for a specific user.
   * Maps to: POST /api/simulator/start/{userId}
   */
  start(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/start/${userId}`, {});
  }

  /**
   * Stops the simulation for a specific user.
   * Maps to: POST /api/simulator/stop/{userId}
   */
  stop(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/stop/${userId}`, {});
  }

  /**
   * Fetches the single most recent data point for the dashboard cards.
   * Maps to: GET /api/simulator/latest/{userId}
   */
  getUserLatest(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/latest/${userId}`, { });
  }

  /**
   * Fetches the entire history for the chart.
   * Maps to: GET /api/simulator/history/{userId}
   */
  getUserHistory(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/${userId}`, {});
  }
}
