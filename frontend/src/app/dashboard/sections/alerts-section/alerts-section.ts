import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { timeAgo } from '../dashboard-utils';

type SeverityFilter = 'ALL' | 'DANGER' | 'WARN';

@Component({
  selector: 'app-alerts-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts-section.html',
  styleUrls: ['./alerts-section.css']
})
export class AlertsSectionComponent {
  @Input() alerts: any[] = [];
  timeAgo = timeAgo;

  severityFilter: SeverityFilter = 'ALL';
  deviceFilter: string = 'ALL';

  get deviceOptions(): string[] {
    const names = new Set<string>();
    for (const a of this.alerts) {
      const n = a?.pipe?.pipeName;
      if (n) names.add(n);
    }
    return Array.from(names).sort();
  }

  get filteredAlerts(): any[] {
    return this.alerts.filter(a => {
      if (this.severityFilter === 'DANGER' && a.status !== 'DANGER') return false;
      if (this.severityFilter === 'WARN' && a.status === 'DANGER') return false;
      if (this.deviceFilter !== 'ALL' && (a?.pipe?.pipeName || 'Unknown') !== this.deviceFilter) return false;
      return true;
    });
  }

  resetFilters() {
    this.severityFilter = 'ALL';
    this.deviceFilter = 'ALL';
  }
}
