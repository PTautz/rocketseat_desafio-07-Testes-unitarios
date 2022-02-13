import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Show profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidv4();
    const password = await hash("batman", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'Doggo', 'donatello@dog.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be possible to show a profile", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "donatello@dog.com",
      password: "batman",
    });

    const { token } = responseToken.body;

    const response = await request(app)
    .get("/api/v1/profile").set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(200);
  });
});
