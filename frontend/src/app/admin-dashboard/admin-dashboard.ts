import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../service/admin';
import { AuthService } from '../service/auth';

type Section = 'overview' | 'users';

interface ExtremeReading {
  value: number;
  pipeName: string;
  userName: string;
}

interface ParameterExtremes {
  parameter: string;
  min: ExtremeReading | null;
  max: ExtremeReading | null;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeSection: Section = 'overview';

  users: any[] = [];
  pipes: any[] = [];
  readings: any[] = [];

  private refreshTimer: any = null;

  get totalUsers(): number { return this.users.length; }

  get totalPipes(): number { return this.pipes.length; }
  get today(): string {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get parameterExtremes(): ParameterExtremes[] {
    return [
      { parameter: 'pH',        min: this.findExtreme('ph', 'min'), max: this.findExtreme('ph','max') },
      { parameter: 'Turbidity', min: this.findExtreme('turbidity', 'min'), max: this.findExtreme('turbidity', 'max') },
      { parameter: 'TDS',       min: this.findExtreme('tds',       'min'), max: this.findExtreme('tds',       'max') },
    ];
  }

  private findExtreme(field: string, kind: 'min' | 'max'): ExtremeReading | null {
    if (this.readings.length === 0) return null;

    let winner = this.readings[0];
    for (const r of this.readings) {
      const v = r[field];
      const w = winner[field];
      if (kind === 'min' && v < w) winner = r;
      if (kind === 'max' && v > w) winner = r;
    }

    return {
      value: winner[field],
      pipeName: winner.pipe?.pipeName,
      userName: winner.pipe?.user?.username ,
    };
  }

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    
  }

  ngOnInit() {
    this.loadAll();
    this.refreshTimer = setInterval(() => this.loadAll(), 15000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadAll() {
    this.adminService.getAllUsers().subscribe(d => {this.users = d || [];console.log('readings:', this.readings);});
    this.adminService.getAllPipes().subscribe(d => this.pipes = d || []);
    this.adminService.getAllReadings().subscribe(d => this.readings = d || []);
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe(d => this.users = d || []);
  }

  setSection(s: Section) { this.activeSection = s; }

  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;
    this.adminService.deleteUser(id).subscribe(() => this.loadUsers());
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }
}
