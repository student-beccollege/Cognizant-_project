import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimulatorService } from '../service/simulator';
import { AuthService } from '../service/auth';
import { AlertsSectionComponent } from './sections/alerts-section/alerts-section';
import { PipePickerComponent } from './sections/pipe-picker/pipe-picker';
import { MetricCardsComponent } from './sections/metric-cards/metric-cards';
import { TrendChartComponent } from './sections/trend-chart/trend-chart';

type ActiveView = 'dashboard' | 'alerts' | 'profile';

type PipeState = {
  latest: any | null;
  history: any[];
  pollHandle: any | null;
};

const HISTORY_MAX = 30;
const POLL_MS = 3000;
const ALERTS_POLL_MS = 5000;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [
    CommonModule,
    FormsModule,
    AlertsSectionComponent,
    PipePickerComponent,
    MetricCardsComponent,
    TrendChartComponent
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {

  pipes: any[] = [];
  selectedPipeId: any = null;
  showAddPipe = false;
  showPipeDropdown = false;
  newPipeName = '';
  newPipeLocation = '';
  activeView: ActiveView = 'dashboard';

  username = '';
  role = '';
  email = '';
  alerts: any[] = [];

  private pipeStates = new Map<any, PipeState>();
  private alertsTimer: any = null;

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  constructor(private service: SimulatorService, private authService: AuthService) {}

  get waterData(): any   { return this.pipeStates.get(this.selectedPipeId)?.latest ?? null; }
  get latest(): any      { return this.pipeStates.get(this.selectedPipeId)?.latest ?? null; }
  get history(): any[]   { return this.pipeStates.get(this.selectedPipeId)?.history ?? []; }
  get isRunning(): boolean { return !!this.pipeStates.get(this.selectedPipeId)?.pollHandle; }
  get selectedPipe(): any { return this.pipes.find(p => p.id === this.selectedPipeId); }

  isPipeRunning(id: any): boolean { return !!this.pipeStates.get(id)?.pollHandle; }
  setView(view: ActiveView) { this.activeView = view; }

  sensorList() {
    const d = this.waterData;
    return [
      { label: 'pH',        unit: '',     value: d?.ph ?? '—',        range: '6.5 – 8.5', safe: !d || (d.ph >= 6.5 && d.ph <= 8.5) },
      { label: 'Turbidity', unit: 'NTU',  value: d?.turbidity ?? '—', range: 'up to 5.0', safe: !d || d.turbidity <= 5 },
      { label: 'TDS',       unit: 'mg/L', value: d?.tds ?? '—',       range: 'up to 500', safe: !d || d.tds <= 500 }
    ];
  }

  allSafe(): boolean { return this.sensorList().every(s => s.safe); }

  ngOnInit() {
    const userId = localStorage.getItem('userId');
    if (!userId) { this.router.navigate(['/login']); return; }
    this.username = localStorage.getItem('username') || 'Operator';
    this.role     = localStorage.getItem('role') || 'USER';
    this.email    = localStorage.getItem('email') || '';
    this.loadPipes(userId);
    this.refreshAlerts();
    this.alertsTimer = setInterval(() => this.refreshAlerts(), ALERTS_POLL_MS);
  }

  ngOnDestroy() {
    this.stopEverything();
  }

  loadPipes(userId: string) {
    this.service.getPipesByUser(userId).subscribe((res: any) => {
      this.pipes = res;
      if (this.pipes.length > 0 && !this.selectedPipeId) {
        this.selectedPipeId = this.pipes[0].id;
        this.loadStoredHistory();
      }
      this.cdr.detectChanges();
    });
  }

  selectPipe(id: any) {
    if (this.selectedPipeId === id) return;
    this.selectedPipeId = id;
    this.loadStoredHistory();
    this.cdr.detectChanges();
  }

  submitAddPipe(event: { pipeName: string; location: string }) {
    const userId = localStorage.getItem('userId');
    const name = event?.pipeName?.trim();
    if (!userId || !name) return;
    this.service.addPipe(userId, name, event.location?.trim() ?? '').subscribe(() => {
      this.cdr.detectChanges();
      this.loadPipes(userId);
    });
  }

  loadStoredHistory() {
    if (!this.selectedPipeId) return;
    const id = this.selectedPipeId;
    const s = this.state(id);
    s.latest = null;
    s.history = [];
    this.service.getPipeHistory(id).subscribe(history => {
      (history || []).slice(-HISTORY_MAX).forEach((d: any) => this.addReading(id, d));
      this.cdr.detectChanges();
    });
  }

  toggleSimulator() {
    const userId = localStorage.getItem('userId');
    if (!userId || !this.selectedPipeId) return;

    if (this.isRunning) {
      this.stopPipe(this.selectedPipeId);
      if (this.runningCount() === 0) this.service.stop(userId).subscribe();
      this.cdr.detectChanges();
      return;
    }
    if (this.runningCount() === 0) {
      this.service.start(userId).subscribe(() => this.startPipe(this.selectedPipeId));
    } else {
      this.startPipe(this.selectedPipeId);
    }
  }

  private startPipe(id: any) {
    const s = this.state(id);
    if (s.pollHandle) return;
    this.pollPipe(id);
    s.pollHandle = setInterval(() => this.pollPipe(id), POLL_MS);
    this.cdr.detectChanges();
  }

  private stopPipe(id: any) {
    const s = this.pipeStates.get(id);
    if (s?.pollHandle) { clearInterval(s.pollHandle); s.pollHandle = null; }
  }

  private pollPipe(id: any) {
    this.service.getPipeLatest(id).subscribe(data => {
      if (!data) return;
      this.addReading(id, data);
      this.cdr.detectChanges();
    });
  }

  private refreshAlerts() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    this.service.getAlerts(userId).subscribe(a => {
      this.alerts = a || [];
      this.cdr.detectChanges();
    });
  }

  private runningCount(): number {
    let n = 0;
    this.pipeStates.forEach(s => { if (s.pollHandle) n++; });
    return n;
  }

  private state(id: any): PipeState {
    let s = this.pipeStates.get(id);
    if (!s) { s = { latest: null, history: [], pollHandle: null }; this.pipeStates.set(id, s); }
    return s;
  }

  private addReading(id: any, data: any): void {
    const s = this.state(id);
    s.latest = { ...data };
    const time = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
    const last = s.history[s.history.length - 1];
    if (last && last.time === time) return;
    s.history = [...s.history, { ...data, time }].slice(-HISTORY_MAX);
  }



  goHome() { this.router.navigate(['/home']); }

  onLogout() {
    this.stopEverything();
    this.authService.logout().subscribe({
      next:  () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }

  private stopEverything() {
    const userId = localStorage.getItem('userId');
    this.pipeStates.forEach(s => { if (s.pollHandle) clearInterval(s.pollHandle); });
    if (this.alertsTimer) clearInterval(this.alertsTimer);
    if (userId) this.service.stop(userId).subscribe();
  }

}
