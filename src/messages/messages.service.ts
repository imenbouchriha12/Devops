import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private tasksService: TasksService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<Message> {
    // Verify task exists and user has access
    await this.tasksService.findOne(createMessageDto.taskId, userId);

    const message = this.messageRepository.create({
      ...createMessageDto,
      senderId: userId,
    });

    const saved = await this.messageRepository.save(message);

    // Load sender info
    const messageWithSender = await this.messageRepository.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });

    if (!messageWithSender) {
      throw new Error('Failed to retrieve saved message');
    }

    return messageWithSender;
  }

  async findAllByTask(taskId: string, userId: string): Promise<Message[]> {
    // Verify task exists and user has access
    await this.tasksService.findOne(taskId, userId);

    return this.messageRepository.find({
      where: { taskId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
