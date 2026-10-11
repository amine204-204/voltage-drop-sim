import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg viewBox="0 0 32.101921 30.38678" [attr.width]="size" [attr.height]="size" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(-130.23494,-154.98979)">
        <path fill="currentColor"
          d="m 133.49986,154.99002 c -1.80861,0 -3.26492,1.45579 -3.26492,3.2644 v 17.7829 l 5.45962,-0.007 10.38696,-17.77618 10.39472,17.72347 2.06034,0.0429 -4.37235,3.88452 -4.33462,-3.92069 2.03089,-0.007 -7.03782,-12.00082 -9.34206,15.98921 -5.24568,0.006 v 2.13992 c 0,1.80861 1.45631,3.26492 3.26492,3.26492 h 25.5726 c 1.80861,0 3.2644,-1.45631 3.2644,-3.26492 v -23.85746 c 0,-1.80861 -1.45579,-3.2644 -3.2644,-3.2644 z"/>
      </g>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class LogoComponent {
  @Input() size: number = 24;
}
