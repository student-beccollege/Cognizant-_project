import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

export class Home implements OnInit {
  userName: string = 'Guest';

  constructor(private router: Router, private cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit() {
    this.authService.me().subscribe({
      next: (res: any) => {
        this.userName = res.username;
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => { localStorage.clear(); this.router.navigate(['/login']); },
      error: () => { localStorage.clear(); this.router.navigate(['/login']); }
    });
  }
}
