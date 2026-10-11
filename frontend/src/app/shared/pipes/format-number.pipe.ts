import { Pipe, PipeTransform } from '@angular/core';
import { formatNum } from '../utils/format.utils';

@Pipe({
  name: 'num',
  standalone: true
})
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined, maxDecimals: number = 2): string {
    return formatNum(value, maxDecimals);
  }
}
