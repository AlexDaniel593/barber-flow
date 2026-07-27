import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { StylistsService } from './stylists.service';
import { Stylist } from './entities/stylist.entity';

describe('StylistsService', () => {
  let service: StylistsService;
  let repository: Repository<Stylist>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StylistsService,
        {
          provide: getRepositoryToken(Stylist),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StylistsService>(StylistsService);
    repository = module.get<Repository<Stylist>>(getRepositoryToken(Stylist));
  });

  describe('findOne', () => {
    it('lanza NotFoundException cuando el stylist no existe', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('retorna el stylist cuando existe', async () => {
      const stylist = { id: '1', name: 'Carlos', services: [] } as Stylist;
      jest.spyOn(repository, 'findOne').mockResolvedValue(stylist);

      await expect(service.findOne('1')).resolves.toEqual(stylist);
    });
  });
});
