import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { CalendarComponent } from '../calendar/calendar.component';
import { PublicApiService } from '../../services/public-api.service';
import { ScheduleApiService, ScheduleEvent } from '../../services/schedule-api.service';

@Component({
  selector: 'app-home-calendar-preview',
  imports: [CalendarComponent, RouterLink],
  templateUrl: './home-calendar-preview.component.html',
  styleUrls: ['./home-calendar-preview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeCalendarPreviewComponent implements OnInit {
  readonly events = signal<ScheduleEvent[]>([]);
  readonly isEnabled = signal(false);

  constructor(
    private readonly publicApi: PublicApiService,
    private readonly scheduleApi: ScheduleApiService
  ) {}

  ngOnInit(): void {
    const from = new Date();
    from.setMonth(from.getMonth() - 1, 1);
    const to = new Date();
    to.setMonth(to.getMonth() + 4, 0);

    combineLatest({
      home: this.publicApi.getHomeFeatureSettings(),
      schedule: this.scheduleApi.getSettings(),
      events: this.scheduleApi.getEvents(from, to)
    }).subscribe({
      next: ({ home, schedule, events }) => {
        this.isEnabled.set(home.calendarPreviewEnabled && schedule.calendarEnabled);
        this.events.set(events);
      }
    });
  }
}
