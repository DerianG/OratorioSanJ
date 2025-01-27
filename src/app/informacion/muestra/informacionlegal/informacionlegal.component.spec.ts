import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionlegalComponent } from './informacionlegal.component';

describe('InformacionlegalComponent', () => {
  let component: InformacionlegalComponent;
  let fixture: ComponentFixture<InformacionlegalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformacionlegalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformacionlegalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
