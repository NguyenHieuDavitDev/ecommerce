import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'MoMo' })
  provider: string;

  @Column({ nullable: true })
  momoOrderId: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  transId: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  payType: string;

  @Column('int', { nullable: true })
  resultCode: number;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  extraData: string;

  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column('int', { nullable: true })
  orderRefId: number;

  @CreateDateColumn()
  createdAt: Date;
}


