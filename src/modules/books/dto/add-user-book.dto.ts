import { IsString, IsOptional } from 'class-validator';

export class AddUserBookDto {
  @IsString()
  isbn: string;

  @IsOptional()
  @IsString()
  descrizioneCondizione?: string;

  // In un vero sistema si prende l'userId dal JWT
  userId?: number;
}




