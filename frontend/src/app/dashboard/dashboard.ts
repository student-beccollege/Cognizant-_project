import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, ElementRef, ViewChild } from '@angular/core';
import { SimulatorService } from '../service/simulator';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('waterChart') chartCanvas!: ElementRef;

  isRunning = false;
  waterData: any = null;
  chart: any;
  private pollInterval: any;
  private cdr = inject(ChangeDetectorRef);

  constructor(private service: SimulatorService) {}

  ngOnInit() {
    setTimeout(() => {
      this.initChart();
      this.loadStoredHistory();
    }, 0);
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadStoredHistory() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    this.service.getUserHistory(userId).subscribe(history => {
      if (history && history.length > 0) {
        this.waterData = history[history.length - 1];
        history.forEach((data: any) => this.addDataToChart(data));
      }
    });
  }

  initChart() {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'pH Level', data: [], borderColor: '#4bc0c0', tension: 0.3 },
          { label: 'Turbidity (NTU)', data: [], borderColor: '#ff6384', tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  toggleSimulator() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    if (this.isRunning) {
      this.isRunning = false;
      this.stopPolling();
      this.service.stop(userId).subscribe();
    } else {
      this.isRunning = true;
      this.cdr.detectChanges();
      this.service.start(userId).subscribe(() => {
        // Fetch the first generated record immediately
        setTimeout(() => this.updateFromLatest(), 500);
        this.startPolling();
      });
    }
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.updateFromLatest(), 5000);
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  updateFromLatest() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.service.getUserLatest(userId).subscribe({
      next: (data) => {
        if (data) {
          console.log("Data received from API:", data); // Check console for field names!

          // Force Angular to see this as a NEW object
          this.waterData = { ...data };

          this.addDataToChart(data);
          this.cdr.detectChanges(); // Manually trigger UI update
        }
      },
      error: (err) => console.error("Could not read from API", err)
    });
  }

  private addDataToChart(data: any) {
    if (!this.chart || !data.ph) return;
    const label = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!this.chart.data.labels.includes(label)) {
      this.chart.data.labels.push(label);
      this.chart.data.datasets[0].data.push(data.ph);
      this.chart.data.datasets[1].data.push(data.turbidity);

      if (this.chart.data.labels.length > 15) {
        this.chart.data.labels.shift();
        this.chart.data.datasets.forEach((d: any) => d.data.shift());
      }
      this.chart.update();
    }
  }
}
