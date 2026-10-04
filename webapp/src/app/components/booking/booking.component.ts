import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CalendarComponent } from '../calendar/calendar.component';
import {
  BookingRequest,
  ScheduleApiService,
  ScheduleEvent,
  ScheduleSettings
} from '../../services/schedule-api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule, RouterLink, CalendarComponent],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingComponent implements OnInit {
  readonly todayKey = this.dateKey(new Date());
  readonly settings = signal<ScheduleSettings | null>(null);
  readonly events = signal<ScheduleEvent[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly selectedDate = signal(new Date());
  readonly selectedServices = signal<string[]>([]);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    date: [this.todayKey, Validators.required],
    time: ['', Validators.required],
    customerStatus: ['new', Validators.required],
    label: [''],
    additionalDetails: [''],
    consentAccepted: [false, Validators.requiredTrue]
  });

  readonly slots = computed(() => {
    const settings = this.settings();
    const date = this.selectedDate();
    if (!settings) return [];
    const hours = settings.businessHours.find(item => item.dayOfWeek === date.getDay());
    if (!hours || hours.isClosed) return [];

    const slots: { value: string; label: string; conflict: boolean }[] = [];
    const [startHour, startMinute] = hours.start.split(':').map(Number);
    const [endHour, endMinute] = hours.end.split(':').map(Number);
    const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);

    while (cursor < end) {
      const value = `${`${cursor.getHours()}`.padStart(2, '0')}:${`${cursor.getMinutes()}`.padStart(2, '0')}`;
      slots.push({
        value,
        label: cursor.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        conflict: this.hasConflict(cursor, settings)
      });
      cursor.setMinutes(cursor.getMinutes() + settings.slotMinutes);
    }
    return slots;
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly api: ScheduleApiService,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    forkJoin({
      settings: this.api.getSettings(),
      events: this.api.getEvents(new Date(new Date().setMonth(new Date().getMonth() - 3)), new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
    }).subscribe({
      next: result => {
        this.settings.set(result.settings);
        this.events.set(result.events);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show('The schedule could not be loaded.', 'error');
      }
    });
  }

  chooseDate(date: Date): void {
    this.selectedDate.set(date);
    this.form.patchValue({ date: this.dateKey(date), time: '' });
  }

  onDateInput(value: string): void {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) this.selectedDate.set(new Date(year, month - 1, day));
  }

  chooseSlot(value: string): void {
    this.form.patchValue({ time: value });
  }

  toggleService(service: string, checked: boolean): void {
    const current = new Set(this.selectedServices());
    checked ? current.add(service) : current.delete(service);
    this.selectedServices.set([...current]);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      this.toast.show('Complete the required fields before sending your request.', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const request: BookingRequest = {
      name: value.name,
      email: value.email,
      phone: value.phone,
      requestedAt: `${value.date}T${value.time}:00`,
      customerStatus: value.customerStatus,
      label: value.label,
      services: this.selectedServices(),
      additionalDetails: value.additionalDetails,
      consentAccepted: value.consentAccepted
    };

    this.submitting.set(true);
    this.api.submitRequest(request).subscribe({
      next: response => {
        this.submitting.set(false);
        this.form.reset({
          name: '', email: '', phone: '', date: this.dateKey(this.selectedDate()), time: '',
          customerStatus: 'new', label: '', additionalDetails: '', consentAccepted: false
        });
        this.selectedServices.set([]);
        this.toast.show(
          response.conflict
            ? 'Request sent. That time may conflict with the schedule, so the business will confirm availability.'
            : 'Request sent. The business will contact you to confirm your appointment.',
          response.conflict ? 'warning' : 'success');
      },
      error: error => {
        this.submitting.set(false);
        this.toast.show(error.error?.message || 'The request could not be sent.', 'error');
      }
    });
  }

  private hasConflict(start: Date, settings: ScheduleSettings): boolean {
    const end = new Date(start.getTime() + settings.slotMinutes * 60000);
    const buffer = settings.bufferMinutes * 60000;
    return this.events().some(event => {
      const eventStart = new Date(event.startsAt).getTime();
      const eventEnd = new Date(event.endsAt).getTime();
      return start.getTime() < eventEnd + buffer && end.getTime() + buffer > eventStart;
    });
  }

  private dateKey(value: Date): string {
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
}
