import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

const id = uuidv4();

describe("Create statement", () => {
  beforeAll(async () => {

    connection = await createConnection();
    await connection.runMigrations();

    const password = await hash("batman", 8);

    // console.log(`UUID Statement Controller inicio: ${id}`);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'Donatello', 'donatello@dog.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be possible to create a deposit", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const depositResponse = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 346,
      description: `Deposit: R$ 346`,
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const response = await request(app).get(`/api/v1/statements/${depositResponse.body.id}`).set({
      Authorization: `Bearer ${token}`
    });

    const getAmount = parseInt(response.body.amount);

    console.log (`O valor da conta do Donatello depois do depósito é : ${getAmount}`);

    expect(depositResponse.status).toBe(201);
    expect(depositResponse.body).toHaveProperty("id");
    expect(depositResponse.body.amount).toStrictEqual(getAmount);
  });

  it("should be able to create a withdraw statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const withdrawResponse = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 46,
      description: "Withdraw: R$ 46",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const statement = await request(app).get(`/api/v1/statements/${withdrawResponse.body.id}`).set({
      Authorization: `Bearer ${token}`
    });

    console.log (`O valor da conta do Donatello depois do saque é : ${statement.body.amount}`);

    expect(withdrawResponse.status).toBe(201);
    expect(withdrawResponse.body).toHaveProperty("id");
    expect(parseInt(statement.body.amount)).toEqual(46);

  });

  it("should not be able to create a withdraw statement when the account has insufficient funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const withdrawResponse = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 9001,
      description: "Withdraw R$ 9001",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(withdrawResponse.status).toBe(400);
    console.log("It's Over nine thousand")
  });

});
