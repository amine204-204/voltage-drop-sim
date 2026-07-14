import { Component, Input, AfterViewInit, ViewChild, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-voltage-chart-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voltage-chart-modal.html',
  styleUrl: './voltage-chart-modal.scss'
})
export class VoltageChartModal implements AfterViewInit, OnDestroy {
  @Output() onClose = new EventEmitter<void>();

  @Input() nodeName: string = '';
  @Input() voltageTimeSeries: number[] = [];
  @Input() nominalVoltage: number = 230;
  @Input() deltaTime: number = 1.0;
  @Input() minLimitPu: number = 0.90;
  @Input() maxLimitPu: number = 1.10;

  @ViewChild('chartCanvas') chartCanvas!: any;
  private chart: any;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  private renderChart() {
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    const labels = this.voltageTimeSeries.map((_, i) => `${i * this.deltaTime}s`);

    const minVoltage = this.nominalVoltage * this.minLimitPu;
    const maxVoltage = this.nominalVoltage * this.maxLimitPu;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Node Voltage (V)',
            data: this.voltageTimeSeries,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#3498db',
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
            title: { display: true, text: 'Voltage (V)' },
            suggestedMin: minVoltage - 20,
            suggestedMax: maxVoltage + 20,
            grid: { color: '#ecf0f1' }
          },
          x: {
            title: { display: true, text: 'Time' },
            grid: { color: '#ecf0f1' }
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
          ctx.strokeStyle = '#e74c3c';
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, yMin);
          ctx.lineTo(chart.chartArea.right, yMin);
          ctx.stroke();
          ctx.fillStyle = '#e74c3c';
          ctx.fillText(`Min Limit (${minVoltage}V)`, chart.chartArea.right - 120, yMin - 5);

          const yMax = yAxis.getPixelForValue(maxVoltage);
          ctx.strokeStyle = '#f39c12';
          ctx.beginPath();
          ctx.moveTo(chart.chartArea.left, yMax);
          ctx.lineTo(chart.chartArea.right, yMax);
          ctx.stroke();
          ctx.fillStyle = '#f39c12';
          ctx.fillText(`Max Limit (${maxVoltage}V)`, chart.chartArea.right - 120, yMax - 5);

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