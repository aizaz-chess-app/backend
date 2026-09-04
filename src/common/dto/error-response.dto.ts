import { ApiProperty } from '@nestjs/swagger';

// The body Nest serialises for any thrown HttpException, whatever the status.
export class ErrorResponseDto {
  @ApiProperty({ description: 'Repeats the HTTP status code.' })
  statusCode!: number;

  @ApiProperty({ description: 'Human-readable explanation of the failure.' })
  message!: string;

  @ApiProperty({ description: 'The HTTP status reason phrase.' })
  error!: string;
}

export class NotFoundErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  declare statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  declare error: string;
}

// ValidationPipe returns one message per failed constraint, so `message` is an array here and a string above.
export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ type: [String], description: 'One entry per failed constraint.' })
  message!: string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}
