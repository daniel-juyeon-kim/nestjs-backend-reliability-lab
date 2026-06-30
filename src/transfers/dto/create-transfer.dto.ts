import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  receiverId!: string;

  @IsInt()
  @Min(1)
  amount!: number;
}
