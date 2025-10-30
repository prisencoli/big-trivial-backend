import { IsString } from 'class-validator';
export class UpdateUserBookDto {
  @IsString()
  status: 'AVAILABLE' | 'NOT_AVAILABLE';
}




