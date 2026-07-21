import { ChangeDetectorRef, Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/utils/error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) { }

  onSubmit() {
    this.errorMessage = '';
    this.authService.login({
      username: this.username,
      password: this.password
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.errorMessage = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
