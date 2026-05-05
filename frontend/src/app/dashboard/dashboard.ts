import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { SimulatorService } from '../service/simulator';
import { AuthService } from '../service/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('waterChart') chartCanvas!: ElementRef;

  pipes: any[] = [];
  selectedPipeId: any = null;
  chart: any;
  showAddPipe = false;
  newPipeName = '';
  newPipeLocation = '';

  // Per-pipe state: each pipe tracks its own data and polling
  private pipeData   = new Map<any, any>();    // latest reading per pipe
  private pipePolls  = new Map<any, any>();    // setInterval handle per pipe
  private pipeCharts = new Map<any, { labels: string[], ph: number[], turbidity: number[] }>();

  private cdr    = inject(ChangeDetectorRef);
  private router = inject(Router);

  constructor(private service: SimulatorService, private authService: AuthService) {}

  // ── Computed getters so the template works without changes ──────────────────
  get waterData(): any  { return this.pipeData.get(this.selectedPipeId) ?? null; }
  get isRunning(): boolean { return this.pipePolls.has(this.selectedPipeId); }

  capAt100(val: number): number { return Math.min(val, 100); }
  isPipeRunning(id: any): boolean { return this.pipePolls.has(id); }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit() {
    const userId = localStorage.getItem('userId') || '1';
    this.loadPipes(userId);
  }

  ngAfterViewInit() { this.initChart(); }

  ngOnDestroy() {
    // Stop all polling and backend simulation on leave
    const userId = localStorage.getItem('userId');
    this.pipePolls.forEach(interval => clearInterval(interval));
    this.pipePolls.clear();
    if (userId) this.service.stop(userId).subscribe();
  }

  // ── Pipe loading ─────────────────────────────────────────────────────────────
  loadPipes(userId: string) {
    this.service.getPipesByUser(userId).subscribe((res: any) => {
      this.pipes = res;
      if (this.pipes.length > 0) {
        this.selectedPipeId = this.pipes[0].id;
        this.cdr.detectChanges();
        this.loadStoredHistory();
      } else {
        this.cdr.detectChanges();
      }
    });
  }

  // ── Pipe selection ───────────────────────────────────────────────────────────
  selectPipe(id: any) {
    if (this.selectedPipeId === id) return;

    // Cache current chart before switching
    this.savePipeChart(this.selectedPipeId);

    this.selectedPipeId = id;
    this.cdr.detectChanges(); // show cached data for the new pipe instantly

    this.clearChart();

    // Restore cached chart if available, otherwise load from history
    if (this.pipeCharts.has(id)) {
      this.restorePipeChart(id);
      this.cdr.detectChanges();
    } else {
      this.loadStoredHistory();
    }
  }

  // ── Simulator toggle (per selected pipe) ─────────────────────────────────────
  toggleSimulator() {
    const userId = localStorage.getItem('userId');
    if (!userId || !this.selectedPipeId) return;

    if (this.isRunning) {
      // Stop polling for this pipe
      this.stopPipe(this.selectedPipeId);

      // If no pipes left running, stop backend too
      if (this.pipePolls.size === 0) {
        this.service.stop(userId).subscribe();
      }
    } else {
      const wasIdle = this.pipePolls.size === 0;

      if (wasIdle) {
        // First pipe to start — boot the backend simulation
        this.service.start(userId).subscribe(() => {
          this.startPipe(this.selectedPipeId);
        });
      } else {
        // Backend already running — just start polling this pipe
        this.startPipe(this.selectedPipeId);
      }
    }
    this.cdr.detectChanges();
  }

  private startPipe(pipeId: any) {
    if (this.pipePolls.has(pipeId)) return;
    // Poll immediately, then every 3 s
    this.pollPipe(pipeId);
    const handle = setInterval(() => this.pollPipe(pipeId), 3000);
    this.pipePolls.set(pipeId, handle);
    this.cdr.detectChanges();
  }

  private stopPipe(pipeId: any) {
    const handle = this.pipePolls.get(pipeId);
    if (handle) clearInterval(handle);
    this.pipePolls.delete(pipeId);
  }

  private pollPipe(pipeId: any) {
    this.service.getPipeLatest(pipeId).subscribe(data => {
      if (!data) return;
      this.pipeData.set(pipeId, { ...data });

      // Only update chart if this pipe is currently selected
      if (pipeId === this.selectedPipeId) {
        this.addDataToChart(data);
        this.cdr.detectChanges();
      }
    });
  }

  // ── Add pipe ─────────────────────────────────────────────────────────────────
  submitAddPipe() {
    const userId = localStorage.getItem('userId');
    if (!userId || !this.newPipeName.trim()) return;
    this.service.addPipe(userId, this.newPipeName.trim(), this.newPipeLocation.trim()).subscribe({
      next: () => {
        this.newPipeName = '';
        this.newPipeLocation = '';
        this.showAddPipe = false;
        this.cdr.detectChanges();
        this.loadPipes(userId);
      }
    });
  }

  onLogout() {
    const userId = localStorage.getItem('userId');
    this.pipePolls.forEach(interval => clearInterval(interval));
    this.pipePolls.clear();
    if (userId) this.service.stop(userId).subscribe();
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }

  // ── Chart helpers ─────────────────────────────────────────────────────────────
  private savePipeChart(pipeId: any) {
    if (!this.chart || !pipeId) return;
    this.pipeCharts.set(pipeId, {
      labels:    [...this.chart.data.labels],
      ph:        [...this.chart.data.datasets[0].data],
      turbidity: [...this.chart.data.datasets[1].data]
    });
  }

  private restorePipeChart(pipeId: any) {
    const cache = this.pipeCharts.get(pipeId);
    if (!cache || !this.chart) return;
    this.chart.data.labels            = [...cache.labels];
    this.chart.data.datasets[0].data  = [...cache.ph];
    this.chart.data.datasets[1].data  = [...cache.turbidity];
    this.chart.update('none');
  }

  private clearChart() {
    if (!this.chart) return;
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach((d: any) => d.data = []);
    this.chart.update('none');
  }

  private addDataToChart(data: any) {
    if (!this.chart || !data.timestamp) return;
    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const labels = this.chart.data.labels;
    if (labels.length > 0 && labels[labels.length - 1] === time) return;

    labels.push(time);
    this.chart.data.datasets[0].data.push(data.ph);
    this.chart.data.datasets[1].data.push(data.turbidity);

    if (labels.length > 15) {
      labels.shift();
      this.chart.data.datasets.forEach((d: any) => d.data.shift());
    }
    this.chart.update('none');
  }

  initChart() {
    if (!this.chartCanvas) return;
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'pH Level',   data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', tension: 0.4, fill: true, pointRadius: 3 },
          { label: 'Turbidity', data: [], borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)',  tension: 0.4, fill: true, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { family: 'Poppins', size: 12 } } } },
        scales: {
          x: { ticks: { font: { family: 'Poppins', size: 11 } } },
          y: { ticks: { font: { family: 'Poppins', size: 11 } } }
        }
      }
    });
  }

  loadStoredHistory() {
    if (!this.selectedPipeId) return;
    const pipeId = this.selectedPipeId;
    this.service.getPipeHistory(pipeId).subscribe(history => {
      if (history && history.length > 0) {
        // Show last known value in metric cards immediately
        this.pipeData.set(pipeId, { ...history[history.length - 1] });

        if (this.chart && pipeId === this.selectedPipeId) {
          const recent = history.slice(-15);
          this.chart.data.labels           = recent.map((d: any) =>
            new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
          this.chart.data.datasets[0].data = recent.map((d: any) => d.ph);
          this.chart.data.datasets[1].data = recent.map((d: any) => d.turbidity);
          this.chart.update('none');
        }
      }
      this.cdr.detectChanges();
    });
  }
}

