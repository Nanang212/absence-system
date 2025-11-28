export class CreateAttendanceDto {
  userId: number;
  type: 'IN' | 'OUT';
  timestamp?: string; // ISO string, optional - if omitted server uses now
  comment?: string;
}
