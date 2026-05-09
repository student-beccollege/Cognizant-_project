import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../service/admin';
import { AuthService } from '../service/auth';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type Section = 'overview' | 'users' | 'pipes' | 'readings';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  activeSection: Section = 'overview';
  sidebarOpen = true;

  users: any[] = [];
  pipes: any[] = [];
  readings: any[] = [];

  // ---- Filters ----
  userSearch = '';
  userRoleFilter: '' | 'ADMIN' | 'USER' = '';

  pipeSearch = '';

  readingSearch = '';
  readingStatusFilter: '' | 'SAFE' | 'WARNING' | 'DANGER' = '';
  readingPipeFilter: number | '' = '';
  readingPage = 1;
  readingPageSize = 15;

  // ---- Edit / create state ----
  editingPipe: any = null;
  editPipeData = { pipeName: '', location: '' };

  showCreateUser = false;
  newUser = { username: '', email: '', password: '', role: 'USER' as 'USER' | 'ADMIN' };
  createUserError = '';

  // ---- Auto refresh ----
  private refreshTimer: any = null;

  // ---- Charts ----
  @ViewChild('statusChartRef') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChartRef') trendChartRef!: ElementRef<HTMLCanvasElement>;
  private statusChart: Chart | null = null;
  private trendChart: Chart | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAll();
    this.refreshTimer = setInterval(() => this.loadAll(true), 15000);
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 0);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.statusChart?.destroy();
    this.trendChart?.destroy();
  }

  // ---- Data loading ----
  loadAll(silent = false) {
    this.loadUsers();
    this.loadPipes();
    this.loadReadings(silent);
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe(data => {
      this.users = data || [];
      this.cdr.detectChanges();
    });
  }

  loadPipes() {
    this.adminService.getAllPipes().subscribe(data => {
      this.pipes = data || [];
      this.cdr.detectChanges();
    });
  }

  loadReadings(_silent = false) {
    this.adminService.getAllReadings().subscribe(data => {
      this.readings = (data || []).sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      this.cdr.detectChanges();
      if (this.activeSection === 'overview') this.renderCharts();
    });
  }

  // ---- Section nav ----
  setSection(s: Section) {
    this.activeSection = s;
    if (s === 'overview') {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  // ---- KPIs ----
  get kpiTotalUsers(): number { return this.users.length; }
  get kpiTotalPipes(): number { return this.pipes.length; }
  get kpiTotalReadings(): number { return this.readings.length; }

  get kpiUnsafeReadings(): number {
    return this.readings.filter(r => r.status && r.status !== 'SAFE').length;
  }

  get kpiSafePercent(): number {
    if (!this.readings.length) return 0;
    const safe = this.readings.filter(r => r.status === 'SAFE').length;
    return Math.round((safe / this.readings.length) * 100);
  }

  get readingsLast24h(): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.readings.filter(r => new Date(r.timestamp).getTime() >= cutoff).length;
  }

  get recentAlerts(): any[] {
    return this.readings.filter(r => r.status && r.status !== 'SAFE').slice(0, 5);
  }

  // ---- Filtered lists ----
  get filteredUsers(): any[] {
    const q = this.userSearch.trim().toLowerCase();
    return this.users.filter(u => {
      if (this.userRoleFilter && u.role !== this.userRoleFilter) return false;
      if (!q) return true;
      return (u.username || '').toLowerCase().includes(q) ||
             (u.email || '').toLowerCase().includes(q);
    });
  }

  get filteredPipes(): any[] {
    const q = this.pipeSearch.trim().toLowerCase();
    if (!q) return this.pipes;
    return this.pipes.filter(p =>
      (p.pipeName || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.user?.username || '').toLowerCase().includes(q)
    );
  }

  get filteredReadings(): any[] {
    const q = this.readingSearch.trim().toLowerCase();
    return this.readings.filter(r => {
      if (this.readingStatusFilter && r.status !== this.readingStatusFilter) return false;
      if (this.readingPipeFilter !== '' && r.pipe?.id !== Number(this.readingPipeFilter)) return false;
      if (!q) return true;
      return (r.pipe?.pipeName || '').toLowerCase().includes(q) ||
             (r.alertReason || '').toLowerCase().includes(q);
    });
  }

  get pagedReadings(): any[] {
    const start = (this.readingPage - 1) * this.readingPageSize;
    return this.filteredReadings.slice(start, start + this.readingPageSize);
  }

  get totalReadingPages(): number {
    return Math.max(1, Math.ceil(this.filteredReadings.length / this.readingPageSize));
  }

  prevPage() { if (this.readingPage > 1) this.readingPage--; }
  nextPage() { if (this.readingPage < this.totalReadingPages) this.readingPage++; }

  // Reset to page 1 whenever filters change
  onReadingFilterChange() { this.readingPage = 1; }

  // ---- User actions ----
  openCreateUser() {
    this.showCreateUser = true;
    this.newUser = { username: '', email: '', password: '', role: 'USER' };
    this.createUserError = '';
  }
  cancelCreateUser() { this.showCreateUser = false; this.createUserError = ''; }

  submitCreateUser() {
    this.createUserError = '';
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      this.createUserError = 'All fields are required';
      return;
    }
    this.adminService.createUser(this.newUser).subscribe({
      next: () => { this.showCreateUser = false; this.loadUsers(); },
      error: err => { this.createUserError = err?.error?.message || 'Failed to create user'; }
    });
  }

  changeUserRole(user: any, newRole: string) {
    if (user.role === newRole) return;
    if (!confirm(`Change ${user.username}'s role to ${newRole}?`)) return;
    this.adminService.updateUserRole(user.id, newRole).subscribe(() => this.loadUsers());
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    this.adminService.deleteUser(id).subscribe(() => this.loadUsers());
  }

  // ---- Pipe actions ----
  startEdit(pipe: any) {
    this.editingPipe = pipe;
    this.editPipeData = { pipeName: pipe.pipeName, location: pipe.location };
  }

  submitEditPipe() {
    if (!this.editingPipe) return;
    this.adminService.updatePipe(this.editingPipe.id, this.editPipeData).subscribe(() => {
      this.editingPipe = null;
      this.loadPipes();
    });
  }

  cancelEdit() { this.editingPipe = null; }

  deletePipe(id: number) {
    if (!confirm('Delete this pipe? Associated readings will become orphaned.')) return;
    this.adminService.deletePipe(id).subscribe(() => this.loadPipes());
  }

  // ---- Logout ----
  onLogout() {
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }

  // ---- Charts ----
  private renderCharts() {
    if (!this.statusChartRef || !this.trendChartRef) return;

    const safe = this.readings.filter(r => r.status === 'SAFE').length;
    const warn = this.readings.filter(r => r.status === 'WARNING').length;
    const danger = this.readings.filter(r => r.status === 'DANGER').length;

    if (this.statusChart) this.statusChart.destroy();
    this.statusChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Safe', 'Warning', 'Danger'],
        datasets: [{
          data: [safe, warn, danger],
          backgroundColor: ['rgba(16,185,129,0.75)', 'rgba(245,158,11,0.75)', 'rgba(239,68,68,0.75)'],
          borderColor: 'rgba(15,23,42,0.9)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
        }
      }
    });

    // Build hourly buckets for the last 24h
    const buckets: { label: string; safe: number; unsafe: number }[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      buckets.push({ label: `${d.getHours()}:00`, safe: 0, unsafe: 0 });
    }
    const start = now.getTime() - 24 * 60 * 60 * 1000;
    for (const r of this.readings) {
      const t = new Date(r.timestamp).getTime();
      if (t < start) continue;
      const idx = 23 - Math.floor((now.getTime() - t) / (60 * 60 * 1000));
      if (idx < 0 || idx > 23) continue;
      if (r.status === 'SAFE') buckets[idx].safe++;
      else buckets[idx].unsafe++;
    }

    if (this.trendChart) this.trendChart.destroy();
    this.trendChart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [
          {
            label: 'Safe',
            data: buckets.map(b => b.safe),
            borderColor: 'rgba(16,185,129,0.9)',
            backgroundColor: 'rgba(16,185,129,0.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 0
          },
          {
            label: 'Unsafe',
            data: buckets.map(b => b.unsafe),
            borderColor: 'rgba(239,68,68,0.9)',
            backgroundColor: 'rgba(239,68,68,0.15)',
            tension: 0.35,
            fill: true,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: 'rgba(148,163,184,0.08)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true }
        }
      }
    });
  }
}
