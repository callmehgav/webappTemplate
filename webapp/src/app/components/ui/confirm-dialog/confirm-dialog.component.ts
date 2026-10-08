import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent implements AfterViewInit {
  @ViewChild('modal') private modal!: ElementRef<HTMLDialogElement>;
  ngAfterViewInit(): void { this.modal.nativeElement.showModal(); }
  readonly title = input('Confirm action');
  readonly message = input('Are you sure?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
