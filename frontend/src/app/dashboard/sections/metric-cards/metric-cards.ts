import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type Sensor = {
  label: string;
  unit: string;
  value: any;
  range: string;
  safe: boolean;
};

@Component({
  selector: 'app-metric-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metric-cards.html',
  styleUrls: ['./metric-cards.css']
})
export class MetricCardsComponent {
  @Input() data: any | null = null;

  sensors(): Sensor[] {
    const d = this.data;
    return [
      { label: 'pH',        unit: '',     value: d?.ph ?? '—',        range: '6.5 – 8.5', safe: !d || (d.ph >= 6.5 && d.ph <= 8.5) },
      { label: 'Turbidity', unit: 'NTU',  value: d?.turbidity ?? '—', range: 'up to 5.0', safe: !d || d.turbidity <= 5 },
      { label: 'TDS',       unit: 'mg/L', value: d?.tds ?? '—',       range: 'up to 500', safe: !d || d.tds <= 500 }
    ];
  }
}
