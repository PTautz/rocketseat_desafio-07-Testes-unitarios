import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

//import de enum direto da entidade para pegar os valores de depósito e retirada
import { OperationType } from "../../entities/Statement";

import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it("should be possible to create a deposit", async () => {
    const user: ICreateUserDTO = {
      name: "Donatello",
      email: "dog@email.com",
      password: "666",
    };
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    const statement = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 666,
      description: "Deposit: R$ 666",
    });

    console.log(`Deposit do Donatello: ${statement.amount}`);

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toEqual(666);
  });

  it("should be possible to create a withdraw", async () => {
    const user: ICreateUserDTO = {
      name: "Jojoca",
      email: "bebe@email.com",
      password: "1234",
    };
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 20,
      description: "Deposit: R$ 20",
    });

    const withdraw = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.WITHDRAW,
      amount: 10,
      description: "Withdraw R$ 10",
    });

    expect(withdraw).toHaveProperty("id");
  });

  it("should not be possible to create a deposit/withdraw for an non-existent user", () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: " without user",
        type: OperationType.DEPOSIT,
        amount: 1200,
        description: "Deposit: R$ 1200",
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("should not be possible to create a withdraw when user when balance <= 0", async () => {
    const user = await createUserUseCase.execute({
      name: "Jocatello",
      email: "bebe@doggo.com",
      password: "1234",
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 1200,
      description: "Deposit: R$ 1200",
    });

    await expect(createStatementUseCase.execute({
        user_id: user.id as string,
        type: OperationType.WITHDRAW,
        amount: 3000,
        description: "Withdraw: R$ 3000",
      })).rejects.toEqual(new CreateStatementError.InsufficientFunds());
  });

});
