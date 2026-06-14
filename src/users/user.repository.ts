import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  exist(email: string) {
    return this.usersRepository.exists({ where: { email } });
  }
  create(dto: RegisterDto) {
    return this.usersRepository.save(dto);
  }
}
