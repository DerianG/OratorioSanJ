import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NopaginaComponent } from './nopagina.component';

describe('NopaginaComponent', () => {
  let component: NopaginaComponent;
  let fixture: ComponentFixture<NopaginaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NopaginaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NopaginaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
