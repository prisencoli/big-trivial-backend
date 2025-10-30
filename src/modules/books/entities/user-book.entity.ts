export class UserBook {
  id: number;
  userId: number;
  isbn: string;
  status: 'AVAILABLE' | 'NOT_AVAILABLE';
  descrizioneCondizione?: string;
  createdAt: Date;
}




