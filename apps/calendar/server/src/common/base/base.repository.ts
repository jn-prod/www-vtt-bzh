import { Model } from 'mongoose';
import { IBaseRepository, ID } from './interface/base-repository.interface';
import { queryParser, getProjection } from '../utils/query';

export class BaseRepository<T, CreateDto, UpdateDto>
  implements IBaseRepository<T, CreateDto, UpdateDto>
{
  private _repository: Model<T>;

  constructor(repository: Model<T>) {
    this._repository = repository;
  }

  public find(
    projection = '',
    limit = 0,
    skip = 0,
    sort = '',
    filter = '',
  ): Promise<T[]> {
    const query: any = queryParser(filter);
    const sortQuery: any = queryParser(sort);

    return this._repository
      .find(query, getProjection(projection))
      .skip(skip)
      .limit(limit)
      .sort(sortQuery)
      .exec();
  }

  public findOne(resource, projection = '', filter = {}): Promise<T> {
    return this._repository
      .findOne({ _id: resource, ...filter }, getProjection(projection))
      .exec();
  }

  public create(resource: CreateDto): Promise<T> {
    return this._repository.create(resource);
  }

  public async updateById(id: ID, resource: UpdateDto): Promise<T> {
    const entity = await this._repository.findByIdAndUpdate(
      { _id: id },
      resource,
    );
    return entity;
  }

  public async updateOrCreate(query: any, resource: UpdateDto): Promise<T> {
    let entity = await this._repository.findOneAndUpdate(
      { ...query },
      resource,
    );

    if (!entity) {
      entity = await this._repository.create(resource);
    }

    return entity;
  }

  public async remove(id: ID): Promise<any> {
    const entity = await this._repository.findByIdAndRemove(id);
    return entity;
  }
}
