import { OperationType } from "../../entities/Statement";
import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

@injectable()
export class CreateStatementUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ user_id, type, amount, description, sender_id}: ICreateStatementDTO) {
    const user = await this.usersRepository.findById(user_id);

    if(!user) {
      throw new CreateStatementError.UserNotFound();
    }

    if(type === 'withdraw') {
      const { balance } = await this.statementsRepository.getUserBalance({ user_id });

      if (balance < amount) {
        throw new CreateStatementError.InsufficientFunds()
      }
    }

    // transferência
    let statementOperation;
    if(type === 'transfer') {
      statementOperation = await this.statementsRepository.create({
        user_id,
        type: OperationType.DEPOSIT,
        amount,
        description
      });
      statementOperation = await this.statementsRepository.create({
        user_id: sender_id == undefined ? "0" : sender_id,
        type: OperationType.WITHDRAW,
        amount,
        description
      });
    } else {
      statementOperation = await this.statementsRepository.create({
        user_id,
        type,
        amount,
        description
      });
    }

    return statementOperation;
  }
}
