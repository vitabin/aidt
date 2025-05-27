export abstract class BaseRepository<T> {
  constructor(private model: any) {}

  async findUnique(where: any): Promise<T | null> {
    return this.model.findUnique({ where });
  }

  async findFirst(where: any): Promise<T | null> {
    return this.model.findFirst({ where });
  }

  async findFirstOrThrow(where: any): Promise<T> {
    return this.model.findFirstOrThrow({ where });
  }

  async findUniqueOrThrow(where: any): Promise<T> {
    return this.model.findUniqueOrThrow({ where });
  }

  async findMany(where: any): Promise<T[]> {
    return this.model.findMany({ where });
  }

  async create(where: any): Promise<T> {
    return this.model.create({ where });
  }

  async update(where: any): Promise<T> {
    return this.model.update({ where });
  }

  async delete(where: any): Promise<T> {
    return this.model.delete({ where });
  }

  async createMany(data: any[]): Promise<T> {
    return this.model.createMany(data);
  }

  async createManyAndReturn(data: any[]): Promise<T[]> {
    return this.createManyAndReturn(data);
  }
}
