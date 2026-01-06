import { Test, TestingModule } from '@nestjs/testing';
import { FlashsaleController } from './flashsale.controller';

describe('FlashsaleController', () => {
  let controller: FlashsaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashsaleController],
    }).compile();

    controller = module.get<FlashsaleController>(FlashsaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
