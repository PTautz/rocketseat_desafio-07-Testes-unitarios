import { getRepository, Repository } from "typeorm";

import { OperationType, Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({user_id, sender_id,amount,description,type}: ICreateStatementDTO): Promise<Statement> {
    // verifica se operação é transferência
    if (type === OperationType.TRANSFER) {
      // saque
      const statementTransfer = this.repository.create({
        user_id: sender_id,
        amount,
        description,
        type
      });

      await this.repository.save(statementTransfer);

      // deposito
      const senderTransferStatement = this.repository.create({
        user_id,
        sender_id,
        amount,
        description,
        type
      });

      return this.repository.save(senderTransferStatement);
    }

    const statement = this.repository.create({
      user_id,
      amount,
      description,
      type
    });

    return this.repository.save(statement);
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.repository.findOne(statement_id, {
      where: { user_id }
    });
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO):
    Promise<
      { balance: number } | { balance: number, statement: Statement[] }
    >
  {
    const statement = await this.repository.find({
      where: { user_id }
    });

 // pega o acc (0) (reduce)passa por cada operação do statement acumulando o valor.
    const balance = statement.reduce((acc, operation) => {
      // Se for deposito ela soma no acumulador com a lista de statements que esta no banco (operation.amount)
      if (operation.type === OperationType.DEPOSIT) {
        return acc + Number(operation.amount);
        // Se for saque deduz...
      } else if (operation.type === OperationType.WITHDRAW) {
        return acc - Number(operation.amount);
        // Senão for nenhum dos anteriores ele verifica o sender_id
      } else {
        // Se existir sender_id subtrai no acumulador dele e soma no user-id
        if (operation.sender_id) {
          return acc + Number(operation.amount);
        }
        return acc - Number(operation.amount);
      }
    }, 0)

    if (with_statement) {
      return {
        statement,
        balance
      }
    }

    return { balance }
  }
}
