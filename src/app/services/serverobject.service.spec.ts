import { TestBed } from '@angular/core/testing';

import { ServerobjectService } from './serverobject.service';

describe('ServerobjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ServerobjectService = TestBed.get(ServerobjectService);
    expect(service).toBeTruthy();
  });
});
