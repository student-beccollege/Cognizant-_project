import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pipe-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pipe-picker.html',
  styleUrls: ['./pipe-picker.css']
})
export class PipePickerComponent {
  @Input() pipes: any[] = [];
  @Input() selectedPipeId: any = null;
  @Input() isRunning = false;

  @Output() pipeSelected = new EventEmitter<any>();
  @Output() addPipe = new EventEmitter<{ pipeName: string; location: string }>();

  showPipeDropdown = false;
  showAddPipe = false;
  newPipeName = '';
  newPipeLocation = '';

  get selectedPipe(): any {
    return this.pipes.find(p => p.id === this.selectedPipeId);
  }

  selectPipe(id: any) {
    this.showPipeDropdown = false;
    this.pipeSelected.emit(id);
  }

  submitAddPipe() {
    const name = this.newPipeName.trim();
    if (!name) return;
    this.addPipe.emit({ pipeName: name, location: this.newPipeLocation.trim() });
    this.newPipeName = '';
    this.newPipeLocation = '';
    this.showAddPipe = false;
  }
}
