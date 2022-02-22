import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;



describe("Create statement", () => {
  beforeAll(async () => {

    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidv4();
    const password = await hash("batman", 8);

    // console.log(`UUID Statement Controller inicio: ${id}`);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'Donatello', 'donatello@dog.com', '${password}', 'now()', 'now()')
    `);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('4d04b6ec-2280-4dc2-9432-8a00f64e7930', 'Jojoca', 'jojoca@bebe.com', '${password}', 'now()', 'now()')
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
      amount: 1000,
      description: `Deposit: R$ 1000`,
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
      amount: 100,
      description: "Withdraw: R$ 100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });


    expect(withdrawResponse.status).toBe(201);
    expect(withdrawResponse.body).toHaveProperty("id");


  });

  it("should not be possible to create a withdraw statement with no funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const withdrawResponse = await request(app).post("/api/v1/statements/withdraw")
    .send({
      amount: 9001,
      description: "Withdraw: R$ 9001",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(withdrawResponse.status).toBe(400);
    console.log("It's Over nine thousand")
  });

  it("should be possible to create a transfer", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const transferResponse = await request(app).post(`/api/v1/statements/transfer/4d04b6ec-2280-4dc2-9432-8a00f64e7930`)
    .send({
      amount: 100,
      description: "Transfer: R$ 100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(transferResponse.status).toBe(201);
    expect(transferResponse.body).toHaveProperty("id");
  });

  it("should not be possible to create a transfer statement with no funds", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const response = await request(app).post(`/api/v1/statements/transfer/4d04b6ec-2280-4dc2-9432-8a00f64e7930`)
    .send({
      amount: 6000,
      description: "Error transfer R$ 6000",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const balanceLoggedUser = await request(app).get("/api/v1/statements/balance").set({
      Authorization: `Bearer ${token}`
    });


    console.log(`O balanço do Donatello : ${balanceLoggedUser.body.balance}`);



    expect(response.status).toBe(400);
    expect(balanceLoggedUser.body.balance).toEqual(800);
  });

});
