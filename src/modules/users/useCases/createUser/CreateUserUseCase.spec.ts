import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";




let createUserUseCase: CreateUserUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
  });

  it ("Should be possible create a new user", async () => {
    const user = await createUserUseCase.execute({
      name: "Donatello",
      email: "user@email.com.br",
      password: "12345"
    });

    expect(user.name).toEqual("Donatello");
    expect(user).toHaveProperty("id");
  });

  it ("Should not be possible create a new user when email already taken", async () => {
    expect(async () => {
      await createUserUseCase.execute({
        name: "donatello",
        email: "donatello@dog.com.br",
        password: "12345"
      });

      await createUserUseCase.execute({
        name: "joaquim",
        email: "donatello@dog.com.br",
        password: "54321"
      })

    }).rejects.toBeInstanceOf(CreateUserError);

  });
});
