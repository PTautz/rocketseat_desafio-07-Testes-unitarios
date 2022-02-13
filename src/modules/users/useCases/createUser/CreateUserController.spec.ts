import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create user controller", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be possible to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Donatello",
      email: "donatello@dog.com",
      password: "1234"
    });

    expect(response.status).toBe(201);
  });

  it("shouldn't be possible to create a user when email already had been taken", async () => {
    const response = await request(app)
    .post("/api/v1/users")
    .send({
      name: "Donatello",
      email: "donatello@dog.com",
      password: "1234"
    });

    expect(response.status).toBe(400);
  });
});
