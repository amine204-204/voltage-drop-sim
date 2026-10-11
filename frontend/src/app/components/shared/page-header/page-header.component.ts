import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title = '';

  constructor(
    private router: Router,
    public themeService: ThemeService
  ) {}

  goBack() {
    this.router.navigate(['']);
  }
}
