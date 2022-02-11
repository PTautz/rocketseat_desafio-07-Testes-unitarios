
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepositoryInMemory: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;

describe("Authenticate User", () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository();
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory);
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory);
  })

  it("should be possible to autheticate", async () => {
    const user: ICreateUserDTO = {
      name: "donatello",
      email: "donatello@email.com",
      password: "senha",
    };

    await createUserUseCase.execute(user);

    const result = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    expect(result).toHaveProperty("token");

  });

  it("should not be possible to autheticate an nonexistent user", async () => {
    expect(async () => await authenticateUserUseCase.execute({
      email: "naoehodonatello@dog.com",
      password: "1234"
    })).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

  it("it should not be possible to autheticate with wrong password", async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "donatello",
        email: "donatello@email.com",
        password:"123456",
      };

      await createUserUseCase.execute(user);

      await authenticateUserUseCase.execute({
        email: user.email,
        password: "senha errada"
      });

    }).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError);
  });

});
