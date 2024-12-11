import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresesionComponent } from './presesion.component';

describe('PresesionComponent', () => {
  let component: PresesionComponent;
  let fixture: ComponentFixture<PresesionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresesionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PresesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
