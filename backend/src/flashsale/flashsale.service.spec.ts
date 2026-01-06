import { Test, TestingModule } from '@nestjs/testing';
import { FlashsaleService } from './flashsale.service';

describe('FlashsaleService', () => {
  let service: FlashsaleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlashsaleService],
    }).compile();

    service = module.get<FlashsaleService>(FlashsaleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
