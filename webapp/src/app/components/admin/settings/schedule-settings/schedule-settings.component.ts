import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../../../services/admin-api.service';
import { ToastService } from '../../../../services/toast.service';
import { CalendarComponent } from '../../../calendar/calendar.component';
import { ConfirmDialogComponent } from '../../../ui/confirm-dialog/confirm-dialog.component';
import {
  CalendarLabel,
  ScheduleEvent,
  ScheduleSettings
} from '../../../../services/schedule-api.service';

interface EventEditor {
  id: string | null;
  title: string;
  eventType: string;
  label: string;
  color: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  notes: string;
}

@Component({
  selector: 'app-schedule-settings',
  imports: [FormsModule, CalendarComponent, ConfirmDialogComponent],
  templateUrl: './schedule-settings.component.html',
  styleUrls: ['./schedule-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleSettingsComponent implements OnInit {
  readonly settings = signal<ScheduleSettings | null>(null);
  readonly events = signal<ScheduleEvent[]>([]);
  readonly saving = signal(false);
  readonly deleteDialogOpen = signal(false);
  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  readonly specialEventTypes = ['Closed', 'Holiday', 'Blocked', 'Other'];
  servicesText = '';
  editor = this.newEditor();

  constructor(
    private readonly api: AdminApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  saveSettings(): void {
    const settings = this.settings();
    if (!settings) return;

    this.saving.set(true);
    const body: ScheduleSettings = {
      ...settings,
      labels: settings.labels
        .map(item => ({ name: item.name.trim(), color: item.color }))
        .filter(item => item.name),
      services: this.servicesText.split('\n').map(value => value.trim()).filter(Boolean)
    };

    this.api.put<ScheduleSettings>('/schedule/admin/settings', body).subscribe({
      next: value => {
        this.settings.set(value);
        this.servicesText = value.services.join('\n');
        this.saving.set(false);
        this.toast.show('Calendar settings saved.', 'success');
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Calendar settings could not be saved.', 'error');
      }
    });
  }

  addLabel(): void {
    this.settings.update(settings => settings
      ? { ...settings, labels: [...settings.labels, { name: '', color: '#356bd6' }] }
      : settings);
  }

  removeLabel(index: number): void {
    this.settings.update(settings => settings
      ? { ...settings, labels: settings.labels.filter((_, itemIndex) => itemIndex !== index) }
      : settings);
  }

  editEvent(event: ScheduleEvent): void {
    this.editor = {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      label: event.label || '',
      color: event.color,
      startsAt: event.isAllDay ? this.localDate(event.startsAt) : this.localDateTime(event.startsAt),
      endsAt: event.isAllDay ? this.localDate(event.endsAt) : this.localDateTime(event.endsAt),
      isAllDay: event.isAllDay,
      notes: event.notes || ''
    };
  }

  chooseDate(date: Date): void {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    this.editor = {
      ...this.newEditor(),
      startsAt: this.localDateTime(start),
      endsAt: this.localDateTime(end)
    };
  }

  eventTypes(settings: ScheduleSettings): string[] {
    return [...new Set([
      this.editor.eventType,
      ...settings.services,
      ...this.specialEventTypes
    ])];
  }

  eventTypeChanged(value: string): void {
    if (value.toLowerCase() !== 'closed') return;
    this.editor.label = '';
    this.editor.color = '#64748b';
    if (!this.editor.isAllDay) {
      this.editor.isAllDay = true;
      this.convertEditorDates(true);
    }
  }

  allDayChanged(isAllDay: boolean): void {
    if (this.editor.eventType.toLowerCase() === 'closed' && !isAllDay) {
      this.editor.isAllDay = true;
      return;
    }
    this.convertEditorDates(isAllDay);
  }

  labelChanged(name: string, labels: CalendarLabel[]): void {
    const label = labels.find(item => item.name === name);
    if (label) this.editor.color = label.color;
  }

  saveEvent(): void {
    const body = {
      ...this.editor,
      startsAt: this.eventDateToIso(this.editor.startsAt, false),
      endsAt: this.eventDateToIso(this.editor.endsAt, true)
    };
    const request = this.editor.id
      ? this.api.put<ScheduleEvent>(`/schedule/admin/events/${this.editor.id}`, body)
      : this.api.post<ScheduleEvent>('/schedule/admin/events', body);

    this.saving.set(true);
    request.subscribe({
      next: event => {
        const current = this.events();
        this.events.set(this.editor.id
          ? current.map(item => item.id === event.id ? event : item)
          : [...current, event]);
        this.editor = this.newEditor();
        this.saving.set(false);
        this.toast.show('Event saved to the calendar.', 'success');
      },
      error: error => {
        this.saving.set(false);
        this.toast.show(error.error?.message || 'Event could not be saved.', 'error');
      }
    });
  }

  requestDelete(): void {
    if (this.editor.id) this.deleteDialogOpen.set(true);
  }

  deleteEvent(): void {
    const id = this.editor.id;
    if (!id) return;
    this.deleteDialogOpen.set(false);
    this.api.delete<{ success: boolean }>(`/schedule/admin/events/${id}`).subscribe({
      next: () => {
        this.events.set(this.events().filter(item => item.id !== id));
        this.editor = this.newEditor();
        this.toast.show('Event deleted.', 'success');
      },
      error: () => this.toast.show('Event could not be deleted.', 'error')
    });
  }

  cancelEdit(): void {
    this.editor = this.newEditor();
  }

  private load(): void {
    forkJoin({
      settings: this.api.get<ScheduleSettings>('/schedule/settings'),
      events: this.api.get<ScheduleEvent[]>('/schedule/admin/events')
    }).subscribe({
      next: result => {
        this.normalizeHours(result.settings);
        this.settings.set(result.settings);
        this.servicesText = result.settings.services.join('\n');
        this.events.set(result.events);
      },
      error: () => this.toast.show('Scheduler could not be loaded.', 'error')
    });
  }

  private normalizeHours(settings: ScheduleSettings): void {
    settings.businessHours = Array.from({ length: 7 }, (_, day) =>
      settings.businessHours.find(item => item.dayOfWeek === day) || {
        dayOfWeek: day,
        start: '09:00',
        end: '17:00',
        isClosed: day === 0
      });
  }

  private convertEditorDates(isAllDay: boolean): void {
    if (isAllDay) {
      this.editor.startsAt = this.editor.startsAt.slice(0, 10);
      this.editor.endsAt = this.editor.endsAt.slice(0, 10);
      return;
    }

    this.editor.startsAt = `${this.editor.startsAt.slice(0, 10)}T09:00`;
    this.editor.endsAt = `${this.editor.endsAt.slice(0, 10)}T10:00`;
  }

  private eventDateToIso(value: string, isEnd: boolean): string {
    const localValue = this.editor.isAllDay
      ? `${value}T${isEnd ? '23:59:59' : '00:00:00'}`
      : value;
    return new Date(localValue).toISOString();
  }

  private newEditor(): EventEditor {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    return {
      id: null,
      title: '',
      eventType: 'Other',
      label: '',
      color: '#356bd6',
      startsAt: this.localDateTime(start),
      endsAt: this.localDateTime(end),
      isAllDay: false,
      notes: ''
    };
  }

  private localDateTime(value: string | Date): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private localDate(value: string | Date): string {
    return this.localDateTime(value).slice(0, 10);
  }
}
