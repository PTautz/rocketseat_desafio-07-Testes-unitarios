import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let getBalanceUseCase: GetBalanceUseCase;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

describe("Balance", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository);
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository);
  });

  it("should be possible to get the user account balance", async () => {
    const user1 = await createUserUseCase.execute({
      name: "Donatello",
      email: "dog@test.com",
      password: "1234"
    })

    const user2 = await createUserUseCase.execute({
      name: "Jojoca",
      email: "bebe@test.com",
      password: "1234"
    })

    // deposit Donatello
    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: "Deposit: R$ 1000",
    });

    // deposit Jojoca
    await createStatementUseCase.execute({
      user_id: user2.id as string,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: "Deposit: R$ 1000",
    });

    // transfer Jojoca > Donatello
    await createStatementUseCase.execute({
      user_id: user1.id as string,
      sender_id: user2.id as string,
      type: OperationType.TRANSFER,
      amount: 500,
      description: `Transfer: $500 to ${user2.name}`,
    });

    const resultBalanceClient2 = await getBalanceUseCase.execute({
      user_id: user2.id as string
    });

    console.log (`Balanço do  Jojoca: ${resultBalanceClient2.balance}`); //500


    // withdraw Donatello
    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "Withdraw: R$ 100",
    });

    const resultBalanceClient1 = await getBalanceUseCase.execute({
      user_id: user1.id as string
    });

    console.log (`Balanço do Donatello: ${resultBalanceClient1.balance}`); //1400

    expect(resultBalanceClient1).toHaveProperty("balance");
    expect(resultBalanceClient1.balance).toBeGreaterThan(0);
    expect(resultBalanceClient1.balance).toEqual(1400);
  });

  it("should not be possible to get the account balance from an non-existent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "non-existent"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
