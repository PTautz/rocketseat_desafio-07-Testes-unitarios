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

    // deposit
    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.DEPOSIT,
      amount: 1000,
      description: "Deposit: R$ 1000",
    });


    // withdraw
    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "Withdraw: R$ 100",
    });

    const resultBalance = await getBalanceUseCase.execute({
      user_id: user1.id as string
    });

    console.log (`Balanço do Donatello: ${resultBalance.balance}`); //900

    expect(resultBalance).toHaveProperty("balance");
    expect(resultBalance.balance).toBeGreaterThan(0);
    expect(resultBalance.balance).toEqual(900);
  });

  it("should not be possible to get the account balance from an non-existent user", () => {
    expect(async () => {
      await getBalanceUseCase.execute({
        user_id: "non-existent"
      });
    }).rejects.toBeInstanceOf(GetBalanceError);
  });
});
