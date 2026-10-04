import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  constructor(
    private readonly http: HttpClient
  ) {}

  get<T>(
    path: string,
    params?: HttpParams
  ): Observable<T> {
    return this.http.get<T>(
      this.createUrl(path),
      {
        params,
        withCredentials: true
      }
    );
  }

  post<T>(
    path: string,
    body: unknown
  ): Observable<T> {
    return this.http.post<T>(
      this.createUrl(path),
      body,
      {
        withCredentials: true
      }
    );
  }

  put<T>(
    path: string,
    body: unknown
  ): Observable<T> {
    return this.http.put<T>(
      this.createUrl(path),
      body,
      {
        withCredentials: true
      }
    );
  }

  delete<T>(
    path: string
  ): Observable<T> {
    return this.http.delete<T>(
      this.createUrl(path),
      {
        withCredentials: true
      }
    );
  }

  resolveContentUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const apiUrl = new URL(
      environment.apiUrl,
      window.location.origin
    );

    return new URL(
      path,
      apiUrl.origin
    ).toString();
  }

  private createUrl(path: string): string {
    const normalizedPath =
      path.startsWith('/')
        ? path
        : `/${path}`;

    return `${environment.apiUrl}${normalizedPath}`;
  }
}