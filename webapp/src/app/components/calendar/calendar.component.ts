import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ScheduleEvent } from '../../services/schedule-api.service';

interface CalendarDay {
  date: Date;
  key: string;
  inMonth: boolean;
  isPast: boolean;
}

interface EventSegment {
  event: ScheduleEvent;
  column: number;
  span: number;
  lane: number;
  startsHere: boolean;
  endsHere: boolean;
}

interface CalendarWeek {
  days: CalendarDay[];
  segments: EventSegment[];
  lanes: number;
}

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent {
  readonly events = input<ScheduleEvent[]>([]);
  readonly editable = input(false);
  readonly eventSelected = output<ScheduleEvent>();
  readonly dateSelected = output<Date>();

  readonly today = this.startOfDay(new Date());
  readonly earliestMonth = new Date(this.today.getFullYear(), this.today.getMonth() - 3, 1);
  readonly visibleMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedKey = signal(this.key(this.today));
  readonly weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly monthLabel = computed(() =>
    this.visibleMonth().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  );

  readonly weeks = computed<CalendarWeek[]>(() => {
    const month = this.visibleMonth();
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 6 }, (_, weekIndex) => {
      const weekStart = new Date(gridStart);
      weekStart.setDate(gridStart.getDate() + weekIndex * 7);
      const days = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);
        return {
          date,
          key: this.key(date),
          inMonth: date.getMonth() === month.getMonth(),
          isPast: date < this.today
        };
      });
      const segments = this.createSegments(days[0].date, days[6].date);
      return { days, segments, lanes: Math.max(segments.reduce((max, item) => Math.max(max, item.lane + 1), 0), 1) };
    });
  });

  previousMonth(): void {
    const current = this.visibleMonth();
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    if (previous >= this.earliestMonth) this.visibleMonth.set(previous);
  }

  nextMonth(): void {
    const current = this.visibleMonth();
    this.visibleMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDate(day: CalendarDay): void {
    this.selectedKey.set(day.key);
    this.dateSelected.emit(day.date);
  }

  selectEvent(event: ScheduleEvent, domEvent: Event): void {
    domEvent.stopPropagation();
    if (this.editable()) this.eventSelected.emit(event);
  }

  eventLabel(event: ScheduleEvent): string {
    if (event.isAllDay) return event.label ? `${event.label} · ${event.title}` : event.title;
    const time = new Date(event.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${time} ${event.label || event.title}`;
  }

  private createSegments(weekStart: Date, weekEnd: Date): EventSegment[] {
    const occupied: boolean[][] = [];
    return this.events()
      .filter(event => this.eventEnd(event) >= weekStart && this.eventStart(event) <= this.endOfDay(weekEnd))
      .sort((a, b) => this.eventStart(a).getTime() - this.eventStart(b).getTime())
      .map(event => {
        const eventStart = this.startOfDay(this.eventStart(event));
        const eventEnd = this.startOfDay(this.eventEnd(event));
        const start = eventStart < weekStart ? weekStart : eventStart;
        const end = eventEnd > weekEnd ? weekEnd : eventEnd;
        const column = Math.round((start.getTime() - weekStart.getTime()) / 86400000) + 1;
        const span = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
        let lane = 0;
        while (occupied[lane]?.slice(column - 1, column - 1 + span).some(Boolean)) lane++;
        occupied[lane] ??= Array(7).fill(false);
        occupied[lane].fill(true, column - 1, column - 1 + span);
        return {
          event,
          column,
          span,
          lane,
          startsHere: eventStart >= weekStart,
          endsHere: eventEnd <= weekEnd
        };
      });
  }

  private eventStart(event: ScheduleEvent): Date {
    return new Date(event.startsAt);
  }

  private eventEnd(event: ScheduleEvent): Date {
    return new Date(event.endsAt);
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private endOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
  }

  private key(value: Date): string {
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
}
