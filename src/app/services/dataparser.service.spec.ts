import { TestBed } from '@angular/core/testing';

import { DataparserService } from './dataparser.service';

describe('DataparserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataparserService = TestBed.get(DataparserService);
    expect(service).toBeTruthy();
  });
});
