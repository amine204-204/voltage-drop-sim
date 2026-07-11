import { Component, Input, Output, EventEmitter, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import dragDataPlugin from 'chartjs-plugin-dragdata';


Chart.register(...registerables, dragDataPlugin);

@Component({
  selector: 'app-load-profile-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './load-profile-editor.html',
  styleUrl: './load-profile-editor.scss'
})
export class LoadProfileEditor implements AfterViewInit, OnDestroy {
  
  @Input() initialProfile: number[] = [];
  @Input() totalSteps: number = 5;
  @Input() profileUnit: string = 'A'; 
  @Output() onSave = new EventEmitter<number[]>();
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('editorCanvas') editorCanvas!: any;
  private chart: any;
  
  private editableData: number[] = [...this.initialProfile];

  ngOnChanges() {
    console.log(this.totalSteps);
    const baseProfile = (this.initialProfile && this.initialProfile.length > 0) 
      ? [...this.initialProfile] 
      : [0];

    this.editableData = [];
    for (let i = 0; i < this.totalSteps; i++) {
      this.editableData.push(baseProfile[i] !== undefined ? baseProfile[i] : 0);
    }

    this.renderChart();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  private renderChart() {
    if (!this.editorCanvas) return;
    const ctx = this.editorCanvas.nativeElement.getContext('2d');

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.editableData.map((_, i) => `T=${i}`),
        datasets: [{
          label: `Load (${this.profileUnit})`,
          data: this.editableData,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#2980b9',
          fill: true,
          tension: 0.1
        }]
      },
            options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y?.toFixed(2)} ${this.profileUnit}`
            }
          },
          dragData: {
            round: 2,
            showTooltip: true, 
            // The drag end event goes inside here too!
            onDragEnd: (event: any, datasetIndex: number, index: number, value: any) => {
              this.editableData[index] = value;
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: this.profileUnit },
            beginAtZero: true, 
            suggestedMax: 100,
            grid: { color: '#ecf0f1' }
          },
          x: {
            title: { display: true, text: 'Time Step' },
            grid: { display: false }
          }
        }
      }
    });
  }

  public save() {
    this.onSave.emit([...this.editableData]);
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}