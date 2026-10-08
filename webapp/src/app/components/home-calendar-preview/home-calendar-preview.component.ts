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

  readonly sectionText = signal({"calendarEyebrow":"Plan ahead","calendarHeading":"Find a date that feels right","calendarDescription":"Browse current availability, then send the details you have in mind. We’ll help with the rest."});

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
        this.sectionText.set({calendarEyebrow: home.calendarEyebrow,calendarHeading: home.calendarHeading,calendarDescription: home.calendarDescription});
        this.isEnabled.set(home.calendarPreviewEnabled && schedule.calendarEnabled);
        this.events.set(events);
      }
    });
  }
}
