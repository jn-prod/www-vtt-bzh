import { Test, TestingModule } from '@nestjs/testing';
import { EventsRepository } from './events.repository';

describe('EventsRepository', () => {
  let provider: EventsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsRepository],
    }).compile();

    provider = module.get<EventsRepository>(EventsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
