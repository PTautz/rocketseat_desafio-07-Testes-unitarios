import request from "supertest";
import { v4 } from "uuid";
import { app } from "../../../../app";
import { Connection } from 'typeorm';
import { createConnection } from 'typeorm';
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

let connection: Connection;

describe("Get Balance ", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = v4();
    const password = await hash("batman", 8);

    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        values('${id}', 'Donatello', 'donatello@dog.com', '${password}', 'now()', 'now()')`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be possible to get balance", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: 'donatello@dog.com',
      password: "batman"
    })

    const { token } = responseToken.body;

    const deposit = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 1000,
      description: "Deposit: R$ 1000",
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    const withdraw = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 500,
      description: "Withdraw: R$ 500",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const balanceLoggedUser = await request(app).get("/api/v1/statements/balance").set({
      Authorization: `Bearer ${token}`
    });

    expect(balanceLoggedUser.status).toBe(200);

    if (balanceLoggedUser.body.statement[0].type === "deposit") {
      expect(balanceLoggedUser.body.statement[0].id).toStrictEqual(deposit.body.id);
    } else {
      expect(balanceLoggedUser.body.statement[0].id).toStrictEqual(withdraw.body.id);
    }

    if (balanceLoggedUser.body.statement[1].type === "withdraw") {
      expect(balanceLoggedUser.body.statement[1].id).toStrictEqual(withdraw.body.id);
    } else {
      expect(balanceLoggedUser.body.statement[1].id).toStrictEqual(deposit.body.id);
    }

    console.log (`O balanço da conta é igual a: ${balanceLoggedUser.body.balance}`);

    expect(balanceLoggedUser.body.balance).toEqual(500);
  });

  it("should not be possible get balance without a token valid", async () => {
    const token = sign("Donatello", "senhaerrada");

    const response = await request(app).get("/api/v1/statements/balance").set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(401);
  });

})
