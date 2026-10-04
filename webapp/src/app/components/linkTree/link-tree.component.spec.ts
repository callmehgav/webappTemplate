import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkTreeComponent } from './link-tree.component';

describe('LinkTreeComponent', () => {
  let component: LinkTreeComponent;
  let fixture: ComponentFixture<LinkTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LinkTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
