import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProposeExchangeDto {
  @IsNumber()
  requestedUserBookId: number;

  @IsOptional()
  @IsNumber()
  offeredUserBookId?: number;

  @IsOptional()
  @IsNumber()
  offeredCredits?: number;

  @IsOptional()
  @IsString()
  message?: string;
}



