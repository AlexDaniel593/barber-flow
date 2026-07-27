import { Injectable, ConflictException, UnauthorizedException, Logger, OnApplicationBootstrap, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JWT_EXPIRES_IN } from '../constants';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async onApplicationBootstrap() {
    const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    const adminName = process.env.ADMIN_BOOTSTRAP_NAME || 'Administrador';

    if (!adminEmail || !adminPassword) {
      return;
    }

    const existingAdmin = await this.userRepository.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await this.userRepository.save(
      this.userRepository.create({
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: UserRole.ADMIN,
      }),
    );

    this.logger.log(`Admin bootstrap creado para ${adminEmail}`);
  }

  async register(dto: RegisterDto) {
    if (dto.role && dto.role !== UserRole.CLIENT) {
      throw new BadRequestException('El registro público solo permite crear usuarios client');
    }

    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      role: UserRole.CLIENT,
    });
    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      role: saved.role,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload, { expiresIn: JWT_EXPIRES_IN });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
