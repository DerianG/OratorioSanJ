import { TestBed } from '@angular/core/testing';

import { DatosFireService } from './datos-fire.service';

describe('DatosFireService', () => {
  let service: DatosFireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DatosFireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
