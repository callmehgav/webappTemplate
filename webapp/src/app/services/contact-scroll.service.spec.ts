import { fakeAsync, tick } from '@angular/core/testing';
import { ContactScrollService } from './contact-scroll.service';

describe('Contact navigation after delayed home layout', () => {
  let service: ContactScrollService;
  let contact: HTMLElement;
  let home: HTMLElement;
  let center: number;
  let scroll: jasmine.Spy;
  beforeEach(() => {
    home = document.createElement('app-home');
    contact = document.createElement('section'); contact.id = 'contact';
    home.appendChild(contact); document.body.appendChild(home);
    center = 2000;
    spyOn(contact, 'getBoundingClientRect').and.callFake(() => ({ top: center - 200, bottom: center + 200 }) as DOMRect);
    scroll = spyOn(contact, 'scrollIntoView').and.callFake(() => { center = window.innerHeight / 2; });
    service = new ContactScrollService();
  });
  afterEach(() => { service.cancel(); home.remove(); });
  it('recenters after a late image load moves the contact section', fakeAsync(() => {
    service.center(); tick(20);
    expect(scroll).toHaveBeenCalledTimes(1);
    center += 900;
    window.dispatchEvent(new Event('load'));
    tick(20);
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'instant', block: 'center' });
    service.cancel();
  }));
  it('stops following layout changes when the visitor scrolls', fakeAsync(() => {
    service.center(); tick(20);
    window.dispatchEvent(new Event('wheel'));
    center += 900;
    window.dispatchEvent(new Event('load')); tick(20);
    expect(scroll).toHaveBeenCalledTimes(1);
    service.cancel();
  }));
  it('handles a repeated Contact us click', fakeAsync(() => {
    service.center(); tick(20);
    center += 900;
    service.center(); tick(20);
    expect(scroll).toHaveBeenCalledTimes(2);
    service.cancel();
  }));
});
