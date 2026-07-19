import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./components/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/main/main.component').then(m => m.MainComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
