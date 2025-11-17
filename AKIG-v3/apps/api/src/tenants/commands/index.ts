import { CreateTenantDto } from '../dto';

export class CreateTenantCommand {
  constructor(
    public readonly data: CreateTenantDto,
    public readonly createdBy: string,
  ) {}
}

export class UpdateTenantCommand {
  constructor(
    public readonly data: any,
    public readonly updatedBy: string,
    public readonly expectedVersion?: number,
  ) {}
}

export class DeleteTenantCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
    public readonly reason?: string,
  ) {}
}
