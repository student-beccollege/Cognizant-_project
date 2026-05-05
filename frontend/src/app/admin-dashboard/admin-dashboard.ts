import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../service/admin';
import { AuthService } from '../service/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'users' | 'pipes' | 'readings' = 'users';

  users: any[] = [];
  pipes: any[] = [];
  readings: any[] = [];

  editingPipe: any = null;
  editPipeData = { pipeName: '', location: '' };

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadPipes();
    this.loadReadings();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe(data => {
      this.users = data;
      this.cdr.detectChanges();
    });
  }

  loadPipes() {
    this.adminService.getAllPipes().subscribe(data => {
      this.pipes = data;
      this.cdr.detectChanges();
    });
  }

  loadReadings() {
    this.adminService.getAllReadings().subscribe(data => {
      this.readings = data;
      this.cdr.detectChanges();
    });
  }

  deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.adminService.deleteUser(id).subscribe(() => this.loadUsers());
  }

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

  deletePipe(id: number) {
    if (!confirm('Are you sure you want to delete this pipe?')) return;
    this.adminService.deletePipe(id).subscribe(() => this.loadPipes());
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }
}
