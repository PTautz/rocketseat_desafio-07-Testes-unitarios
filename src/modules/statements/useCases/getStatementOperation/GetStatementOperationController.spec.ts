import request from "supertest";
import { v4 } from "uuid";
import { app } from "../../../../app";
import { Connection } from 'typeorm';
import { createConnection } from 'typeorm';
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

let connection: Connection;

describe("Get Statement Operation", () => {

  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = v4();
    const password = await hash("batman", 8);

    await connection.query(
      `INSERT INTO users(id, name, email, password, created_at, updated_at)
        values('${id}', 'Donatello', 'donatello@email.com', '${password}', 'now()', 'now()')`
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("should be possible get statement operation", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: 'donatello@email.com',
      password: "batman"
    })

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

    response.body.amount = parseInt(response.body.amount);

    console.log(`operação de depósito no valor de : ${response.body.amount}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(depositResponse.body);
  });


  it("should not be possible get statement operation with invalid token", async () => {
    const token = sign("Donatelo", "senhaerrada");

    const deposit = await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 1000,
      description: "Deposit: R$ 1000",
    })
    .set({
      Authorization: `Bearer ${token}`
    });

    const response = await request(app).get(`/api/v1/statements/${deposit.body.id}`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(401);
  });

  it("should not possible get statement operation without statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: 'donatello@email.com',
      password: "batman"
    })

    const { token } = responseToken.body;

    const response = await request(app).get(`/api/v1/statements/86d55669-1a00-4f69-9618-ec7078e39e9c`).set({
      Authorization: `Bearer ${token}`
    });

    expect(response.status).toBe(404);
  });

})
