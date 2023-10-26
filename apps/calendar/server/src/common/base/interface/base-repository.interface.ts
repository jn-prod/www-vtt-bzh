export type ID = string;

export interface IBaseRepository<T, CreateDto, UpdateDto> {
  find(): Promise<T[]>;

  findOne(id: ID): Promise<T>;

  create(resource: CreateDto): Promise<T>;

  updateById(id: ID, resource: UpdateDto): Promise<T>;

  updateOrCreate(query: any, resource: UpdateDto): Promise<T>;

  remove(id: ID);
}
