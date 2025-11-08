export class Exchange {
  id: number;
  proposerUserId: number;
  requestedUserBookId: number;
  offeredUserBookId?: number;
  offeredCredits?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}








