import { Component, Input, AfterViewInit, ViewChild, OnDestroy, Output, EventEmitter, ElementRef } from '@angular/core';
import { ModalComponent } from '../shared/modal/modal.component';
import { Chart, registerables } from 'chart.js';
import { getCssVar } from '../../services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-voltage-chart-modal',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './voltage-chart-modal.component.html',
  styleUrl: './voltage-chart-modal.component.scss'
})
export class VoltageChartModal implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  @Input() nodeName: string = '';
  @Input() voltageTimeSeries: number[] = [];
  @Input() nominalVoltage: number = 230;
  @Input() deltaTime: number = 1.0;
  @Input() minLimitPu: number = 0.90;
  @Input() maxLimitPu: number = 1.10;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  private renderChart() {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.voltageTimeSeries.map((_, i) => `${i * this.deltaTime}s`);

    const minVoltage = this.nominalVoltage * this.minLimitPu;
    const maxVoltage = this.nominalVoltage * this.maxLimitPu;

    const textSecondary = getCssVar('--text-secondary', '#8891A0');
    const accent = getCssVar('--accent', '#E8A33D');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Node Voltage (V)',
            data: this.voltageTimeSeries,
            borderColor: accent,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: accent,
            fill: true,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y?.toFixed(2)} V`
            }
          }
        },
        scales: {
          y: {
            title: { display: true, text: 'Voltage (V)', color: textSecondary },
            suggestedMin: minVoltage - (maxVoltage - minVoltage) / 4,
            suggestedMax: maxVoltage + (maxVoltage - minVoltage) / 4,
            grid: { color: textSecondary + '33' }
          },
          x: {
            title: { display: true, text: 'Time', color: textSecondary },
            grid: { color: textSecondary + '33' }
          }
        }
      },
      plugins: [{
        id: 'normLimits',
        afterDraw: (chart) => {
          const yAxis = chart.scales['y'];
          const ctx = chart.ctx;

          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 2;
          ctx.font = '12px Arial';

          const yMin = yAxis.getPixelForValue(minVoltage);
          ctx.strokeStyle = getCssVar('--status-danger', '#e74c3c');
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, yMin);
          ctx.lineTo(chart.chartArea.right, yMin);
          ctx.stroke();
          ctx.fillStyle = getCssVar('--status-danger', '#e74c3c');
          ctx.fillText(`Min Limit (${minVoltage.toFixed(2)}V)`, chart.chartArea.right - 120, yMin - 5);

          const yMax = yAxis.getPixelForValue(maxVoltage);
          ctx.strokeStyle = getCssVar('--accent', '#f39c12');
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, yMax);
          ctx.lineTo(chart.chartArea.right, yMax);
          ctx.stroke();
          ctx.fillStyle = getCssVar('--accent', '#f39c12');
          ctx.fillText(`Max Limit (${maxVoltage.toFixed(2)}V)`, chart.chartArea.right - 120, yMax - 5);

          ctx.restore();
        }
      }]
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
