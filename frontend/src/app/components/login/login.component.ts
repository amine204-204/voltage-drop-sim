import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isRegisterMode = false;
  username = '';
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';

    if (this.isRegisterMode) {
      this.authService.register({
        username: this.username,
        email: this.email,
        password: this.password
      }).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.errorMessage = err.status === 400
            ? 'Username or email already exists'
            : 'Registration failed';
        }
      });
    } else {
      this.authService.login({
        username: this.username,
        password: this.password
      }).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => {
          this.errorMessage = 'Invalid username or password';
        }
      });
    }
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
  }
}
