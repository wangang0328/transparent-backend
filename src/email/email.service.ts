import {Injectable} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {Transporter, createTransport} from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = createTransport({
      host: configService.get('nodemailer_host'),
      port: configService.get('nodemailer_port'),
      secure: false,
      auth: {
        user: configService.get('nodemailer_auth_user'),
        pass: configService.get('nodemailer_auth_pass')
      }
    });
  }

  sendMail(to: string, subject: string, html: string) {
    return this.transporter.sendMail({
      from: {
        name: '前端监控平台',
        address: this.configService.get('nodemailer_auth_user')
      },
      to,
      subject,
      html
    });
  }
}
