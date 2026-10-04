import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AdminApiService } from './admin-api.service';

interface LoginResponse {
  success: boolean;
  username: string;
}

interface SessionResponse {
  authenticated: boolean;
  username: string;
}

interface LogoutResponse {
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly usernameState = signal<string | null>(null);

  readonly username = this.usernameState.asReadonly();
  readonly isLoggedIn = computed(() => this.usernameState() !== null);

  constructor(
    private readonly http: HttpClient,
    private readonly adminApi: AdminApiService
  ) {}

  login(username: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/admin/login`,
      { username, password },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.usernameState.set(response.username);
      }),
      map(() => undefined)
    );
  }

  checkSession(): Observable<boolean> {
    return this.http.get<SessionResponse>(
      `${environment.apiUrl}/admin/session`,
      { withCredentials: true }
    ).pipe(
      tap(response => this.usernameState.set(response.username)),
      map(() => true),
      catchError(() => {
        this.usernameState.set(null);
        return of(false);
      })
    );
  }

  logout(): Observable<void> {
    return this.adminApi.post<LogoutResponse>('/admin/logout', {}).pipe(
      map(() => undefined),
      finalize(() => {
        this.usernameState.set(null);
      })
    );
  }
}