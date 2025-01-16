import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularionivelesComponent } from './formularioniveles.component';

describe('FormularionivelesComponent', () => {
  let component: FormularionivelesComponent;
  let fixture: ComponentFixture<FormularionivelesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularionivelesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularionivelesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
