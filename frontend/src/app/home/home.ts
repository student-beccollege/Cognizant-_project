import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  userName: string = 'Guest';
  sessionTimeLeft: string = '00:00';

  private expiryTime: number = 0;
  private timerInterval: any;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private authService: AuthService) {
    const state = history.state as { user: string; expiry: number };

    if (state?.expiry) {
      this.userName = state.user;
      this.expiryTime = Number(state.expiry);
      localStorage.setItem('userName', this.userName);
      localStorage.setItem('expiry', this.expiryTime.toString());
    } else {
      const savedUser = localStorage.getItem('userName');
      const savedExpiry = localStorage.getItem('expiry');
      if (savedUser && savedExpiry) {
        this.userName = savedUser;
        this.expiryTime = Number(savedExpiry);
      }
      // No redirect here — AuthGuard handles unauthenticated access
    }
  }

  ngOnInit() {
    this.startCountdown();
  }

  startCountdown() {
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  updateTimer() {
    const diff = this.expiryTime - Date.now();
    if (diff <= 0) {
      this.logout();
    } else {
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      this.sessionTimeLeft = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      this.cdr.detectChanges();
    }
  }

  logout() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
