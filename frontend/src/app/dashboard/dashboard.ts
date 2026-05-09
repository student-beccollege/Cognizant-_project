import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { SimulatorService } from '../service/simulator';
import { AuthService } from '../service/auth';
import { AlertsSectionComponent } from './sections/alerts-section/alerts-section';

Chart.register(...registerables);

type ActiveView = 'dashboard' | 'alerts' | 'profile';

// Everything we remember about ONE pipe.
type PipeState = {
  latest: any | null;       // most recent reading (drives the metric cards)
  history: any[];           // last N readings, each tagged with .time (drives the chart)
  pollHandle: any | null;   // setInterval id while this pipe is streaming; null otherwise
};

const HISTORY_MAX = 30;
const POLL_MS = 3000;
const ALERTS_POLL_MS = 5000;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, FormsModule, AlertsSectionComponent]
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── UI state ──────────────────────────────────────────────────────────
  pipes: any[] = [];
  selectedPipeId: any = null;
  showAddPipe = false;
  showPipeDropdown = false;
  newPipeName = '';
  newPipeLocation = '';
  activeView: ActiveView = 'dashboard';

  // ── User + alerts ─────────────────────────────────────────────────────
  username = '';
  role = '';
  email = '';
  alerts: any[] = [];

  // ── Per-pipe data (one PipeState per pipe id) ─────────────────────────
  private pipeStates = new Map<any, PipeState>();
  private alertsTimer: any = null;

  // ── Trend chart ───────────────────────────────────────────────────────
  private trendChart: Chart | null = null;
  @ViewChild('trendCanvas')
  set trendCanvasRef(el: ElementRef<HTMLCanvasElement> | undefined) {
    if (el?.nativeElement) {
      this.createTrendChart(el.nativeElement);
      this.refreshTrendChart();
    } else {
      this.destroyTrendChart();
    }
  }

  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  constructor(private service: SimulatorService, private authService: AuthService) {}

  // ── Things the HTML reads ─────────────────────────────────────────────
  get waterData(): any   { return this.pipeStates.get(this.selectedPipeId)?.latest ?? null; }
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

  // ── Lifecycle ─────────────────────────────────────────────────────────
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
    this.destroyTrendChart();
  }

  // ── Pipes ─────────────────────────────────────────────────────────────
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

  submitAddPipe() {
    const userId = localStorage.getItem('userId');
    if (!userId || !this.newPipeName.trim()) return;
    this.service.addPipe(userId, this.newPipeName.trim(), this.newPipeLocation.trim()).subscribe(() => {
      this.newPipeName = '';
      this.newPipeLocation = '';
      this.showAddPipe = false;
      this.cdr.detectChanges();
      this.loadPipes(userId);
    });
  }

  // Replace the selected pipe's history with stored readings from the server.
  loadStoredHistory() {
    if (!this.selectedPipeId) return;
    const id = this.selectedPipeId;
    const s = this.state(id);
    s.latest = null;
    s.history = [];
    this.service.getPipeHistory(id).subscribe(history => {
      (history || []).slice(-HISTORY_MAX).forEach((d: any) => this.addReading(id, d));
      this.refreshTrendChart();
      this.cdr.detectChanges();
    });
  }

  // ── Streaming ─────────────────────────────────────────────────────────
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
      console.log('[pollPipe] id=', id, 'selectedPipeId=', this.selectedPipeId, 'data=', data);
      if (!data) return;
      const added = this.addReading(id, data);
      if (id === this.selectedPipeId && added) this.refreshTrendChart();
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

  // ── Per-pipe state helpers ────────────────────────────────────────────
  private state(id: any): PipeState {
    let s = this.pipeStates.get(id);
    if (!s) { s = { latest: null, history: [], pollHandle: null }; this.pipeStates.set(id, s); }
    return s;
  }

  // Save a reading. Returns true if it's new (not the same timestamp as the previous one).
  private addReading(id: any, data: any): boolean {
    const s = this.state(id);
    s.latest = { ...data };
    const time = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
    const last = s.history[s.history.length - 1];
    if (last && last.time === time) return false;
    s.history.push({ ...data, time });
    if (s.history.length > HISTORY_MAX) s.history.shift();
    return true;
  }

  

  // ── Navigation ────────────────────────────────────────────────────────
  goHome() { this.router.navigate(['/home']); }

  onLogout() {
    this.stopEverything();
    this.authService.logout().subscribe({
      next:  () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }

  // Stop all polling timers and tell the backend to stop the simulator.
  private stopEverything() {
    const userId = localStorage.getItem('userId');
    this.pipeStates.forEach(s => { if (s.pollHandle) clearInterval(s.pollHandle); });
    if (this.alertsTimer) clearInterval(this.alertsTimer);
    if (userId) this.service.stop(userId).subscribe();
  }

  // ── Chart.js trend chart ──────────────────────────────────────────────
  private createTrendChart(canvas: HTMLCanvasElement) {
    if (this.trendChart) this.trendChart.destroy();
    const dataset = (label: string, color: string, fill: string) => ({
      label, data: [], borderColor: color, backgroundColor: fill,
      tension: 0.4, fill: 'origin', pointRadius: 3, pointHoverRadius: 5,
      pointBackgroundColor: '#ffffff', pointBorderColor: color, pointBorderWidth: 2,
      borderWidth: 2.5, spanGaps: true
    });
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          dataset('pH Level',        '#3b82f6', 'rgba(59, 130, 246, 0.18)'),
          dataset('Turbidity (NTU)', '#ef4444', 'rgba(239, 68, 68, 0.18)')
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 28, boxHeight: 14, padding: 18, font: { size: 13, weight: 500 }, color: '#f1f5f9' }
          },
          tooltip: { callbacks: { title: items => items.length ? `Time: ${items[0].label}` : '' } }
        },
        scales: {
          x: { ticks: { font: { size: 10 }, color: '#cbd5e1', maxRotation: 60, minRotation: 60, autoSkip: false }, grid: { color: 'rgba(148, 163, 184, 0.15)' } },
          y: { beginAtZero: true, ticks: { font: { size: 11 }, color: '#cbd5e1', stepSize: 1 }, grid: { color: 'rgba(148, 163, 184, 0.15)' } }
        }
      }
    });
  }

  private refreshTrendChart() {
    if (!this.trendChart) return;
    const history = this.pipeStates.get(this.selectedPipeId)?.history || [];
    this.trendChart.data.labels = history.map(r => {
      const d = new Date(r.time);
      return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    });
    this.trendChart.data.datasets[0].data = history.map(r => Number(r.ph));
    this.trendChart.data.datasets[1].data = history.map(r => Number(r.turbidity));
    this.trendChart.update('none');
  }

  private destroyTrendChart() {
    if (this.trendChart) { this.trendChart.destroy(); this.trendChart = null; }
  }
}
