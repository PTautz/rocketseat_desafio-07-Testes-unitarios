import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate user", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidv4();
    const password = await hash("666", 8);

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

  it("should be possible to authenticate a user", async () => {
    const response = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "donatello@dog.com",
      password: "666",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not be possible to authenticate non-existent user", async () => {
    const response = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "noone@email.com",
      password: "madhatter",
    });

    expect(response.status).toBe(401);
  });

  it("should not possible to authenticate a user with wrong password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "donatello@dog.com",
      password: "senha errada",
    });

    expect(response.status).toBe(401);
  });
});
