import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('Confirmation dialog placement', () => {
  it('uses the browser top layer despite a transformed tile ancestor', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    const tile = document.createElement('div');
    tile.style.transform = 'translateZ(0)';
    tile.style.height = '2000px';
    document.body.appendChild(tile);
    tile.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.matches(':modal')).toBeTrue();
    const bounds = dialog.getBoundingClientRect();
    expect(Math.abs(bounds.top)).toBeLessThan(2);
    expect(Math.abs(bounds.height - window.innerHeight)).toBeLessThan(2);
    const cancel = spyOn(fixture.componentInstance.cancelled, 'emit');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(cancel).toHaveBeenCalled();
    fixture.destroy();
    tile.remove();
  });
});
