import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BusinessHours {
  dayOfWeek: number;
  start: string;
  end: string;
  isClosed: boolean;
}

export interface CalendarLabel {
  name: string;
  color: string;
}

export interface ScheduleSettings {
  calendarEnabled: boolean;
  requestsEnabled: boolean;
  bookingButtonLabel: string;
  requestHeading: string;
  labelFieldName: string;
  detailsLabel: string;
  timeZoneId: string;
  bufferMinutes: number;
  slotMinutes: number;
  businessHours: BusinessHours[];
  labels: CalendarLabel[];
  services: string[];
}

export interface ScheduleEvent {
  id: string;
  title: string;
  eventType: string;
  label: string | null;
  color: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  isBlocked: boolean;
  notes?: string | null;
}

export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  requestedAt: string;
  customerStatus: string;
  label: string;
  services: string[];
  additionalDetails: string;
  consentAccepted: boolean;
}

export interface BookingResponse {
  success: boolean;
  conflict: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleApiService {
  constructor(private readonly http: HttpClient) {}

  getSettings(): Observable<ScheduleSettings> {
    return this.http.get<ScheduleSettings>(this.url('/schedule/settings'));
  }

  getEvents(from: Date, to: Date): Observable<ScheduleEvent[]> {
    const params = new HttpParams()
      .set('from', from.toISOString())
      .set('to', to.toISOString());
    return this.http.get<ScheduleEvent[]>(this.url('/schedule/events'), { params });
  }

  submitRequest(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.url('/schedule/requests'), request);
  }

  private url(path: string): string {
    return `${environment.apiUrl}${path}`;
  }
}
