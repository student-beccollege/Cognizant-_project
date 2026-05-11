import {
  Component, ElementRef, Input,
  OnChanges, OnDestroy, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trend-chart.html',
  styleUrls: ['./trend-chart.css']
})
export class TrendChartComponent implements OnChanges, OnDestroy {
  @Input() history: any[] = [];

  private chart: Chart | null = null;

  @ViewChild('trendCanvas')
  set canvasRef(el: ElementRef<HTMLCanvasElement> | undefined) {
    if (el?.nativeElement) {
      this.createChart(el.nativeElement);
      this.refresh();
    } else {
      this.destroyChart();
    }
  }

  ngOnChanges() {
    this.refresh();
  }

  ngOnDestroy() {
    this.destroyChart();
  }

  hasData(): boolean {
    return this.history.length > 0;
  }

  private createChart(canvas: HTMLCanvasElement) {
    const dataset = (label: string, color: string, fill: string) => ({
      label, data: [], borderColor: color, backgroundColor: fill,
      tension: 0.4, fill: 'origin', pointRadius: 3, pointHoverRadius: 5,
      pointBackgroundColor: '#ffffff', pointBorderColor: color, pointBorderWidth: 2,
      borderWidth: 2.5, spanGaps: true
    });
    this.chart = new Chart(canvas, {
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

  private refresh() {
    if (!this.chart) return;
    this.chart.data.labels = this.history.map(r => {
      const d = new Date(r.time);
      return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
    });
    this.chart.data.datasets[0].data = this.history.map(r => Number(r.ph));
    this.chart.data.datasets[1].data = this.history.map(r => Number(r.turbidity));
    this.chart.update('none');
  }

  private destroyChart() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
  }
}
