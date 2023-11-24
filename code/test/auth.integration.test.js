import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const adminAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzgyOTMsImV4cCI6MTcxNzYxNDMwMSwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.6yWTA63eMapfh_rhh1BLWuFyWqU_6N8j5kKB-Qgmwf0";
const userAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1MDksImV4cCI6MTcxNzYxNDUxMCwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.trCxraFlVYofXulZHkNhxFyeM_3JyW8Mw-_E_c7aYRI";
const adminRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg0MTAsImV4cCI6MTcxNzYxNDQxMiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.lYjWcduhkdj39MEEs1U-I1rVgl5kZ46rHizN7EQetU8";
const userRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1NTEsImV4cCI6MTcxNzYxNDU1MiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.B31B-rwRUHwq_b_3YPWmnWg6vg6cpuQpH2GWld0Z1jY";

let adminCookies = `${adminAccessToken}; ${adminRefreshToken}`;
let userCookies = `${userAccessToken}; ${userRefreshToken}`;

describe("register", () => {

    /* clean up the users in the opened connection to the db */
    beforeEach(async () => {
        await User.deleteMany();
    });

    test('Should register a user and return a 200 response with a success message', async () => {
        const body = {
            username: "testuser",
            email: "test@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({ data: { message: "User added successfully" } });

        const createdUser = await User.findOne({ username: body.username });
        expect(createdUser).toBeDefined();
        expect(createdUser.email).toBe(body.email);
        expect(createdUser.role).toBe("Regular");
    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {
        const body = {
            username: "testuser",
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The request body does not contain all the necessary attributes" });

        const createdUser = await User.findOne({ username: body.username });
        expect(createdUser).toBeNull();
    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const body = {
            username: "",
            email: "test@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "At least one of the parameters in the request body is an empty string" });

        const createdUser = await User.findOne({ email: body.email });
        expect(createdUser).toBeNull();
    });
    test('Should return a 400 error if the email in the request body is not in a valid email format', async () => {
        const body = {
            username: "testuser",
            email: "invalidemail",
            password: "password123"
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The email in the request body is not in a valid email format" });

        const createdUser = await User.findOne({ username: body.username });
        expect(createdUser).toBeNull();
    });
    test('Should return a 400 error if the user in the request body identifies an already existing user', async () => {
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "password123"
        };
        await User.create(existingUser);

        const body = {
            username: "existinguser",
            email: "newuser@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The user in the request body identifies an already existing user" });

        const createdUser = await User.findOne({ email: body.email });
        expect(createdUser).toBeNull();
    });
    test('Should return a 400 error if the email in the request body identifies an already existing user', async () => {
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "password123"
        };
        await User.create(existingUser);

        const body = {
            username: "newuser",
            email: "existing@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/register').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The email in the request body identifies an already existing user" });

        const createdUser = await User.findOne({ username: body.username });
        expect(createdUser).toBeNull();
    });
});

describe("registerAdmin", () => {

    /* clean up the users in the opened connection to the db */
    beforeEach(async () => {
        await User.deleteMany();
    });

    test('Should register an admin and return a 200 response with a success message', async () => {
        const body = {
            username: "adminuser",
            email: "admin@example.com",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toEqual(200);
        expect(res.body).toEqual({ data: { message: "Admin added successfully" } });

        const createdAdmin = await User.findOne({ username: body.username });
        expect(createdAdmin).toBeDefined();
        expect(createdAdmin.email).toBe(body.email);
        expect(createdAdmin.role).toBe("Admin");
    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {
        const body = {
            username: "adminuser",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The request body does not contain all the necessary attributes" });

        const createdAdmin = await User.findOne({ username: body.username });
        expect(createdAdmin).toBeNull();
    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const body = {
            username: "",
            email: "admin@example.com",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toBe(400);

        const createdAdmin = await User.findOne({ email: body.email });
        expect(createdAdmin).toBeNull();
    });
    test('Should return a 400 error if the email in the request body is not in a valid email format', async () => {
        const body = {
            username: "adminuser",
            email: "invalidemail",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The email in the request body is not in a valid email format" });

        const createdAdmin = await User.findOne({ username: body.username });
        expect(createdAdmin).toBeNull();
    });
    test('Should return a 400 error if the user in the request body identifies an already existing user', async () => {
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "password123",
            role: "Regular"
        };
        await User.create(existingUser);

        const body = {
            username: "existinguser",
            email: "admin@example.com",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The user in the request body identifies an already existing user" });

        const createdAdmin = await User.findOne({ email: body.email });
        expect(createdAdmin).toBeNull();
    });
    test('Should return a 400 error if the email in the request body identifies an already existing user', async () => {
        const existingUser = {
            username: "existinguser",
            email: "existing@example.com",
            password: "password123",
            role: "Regular"
        };
        await User.create(existingUser);

        const body = {
            username: "adminuser",
            email: "existing@example.com",
            password: "admin123"
        };

        const res = await request(app).post('/api/admin').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The email in the request body identifies an already existing user" });

        const createdAdmin = await User.findOne({ username: body.username });
        expect(createdAdmin).toBeNull();
    });

});

describe("login", () => {
    beforeEach(async () => {
        // Creare un utente di esempio nel database
        const hashedPassword = await bcrypt.hash("password123", 12);
        await User.create({
            username: "user123",
            email: "user@example.com",
            password: hashedPassword,
            role: "Regular",
        });
    });

    afterEach(async () => {
        // Pulire il database dopo ogni test
        await User.deleteMany();
    });

    test('Should log in a user and return a 200 response with access and refresh tokens', async () => {
        const body = {
            email: "user@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data.accessToken");
        expect(res.body).toHaveProperty("data.refreshToken");

        const user = await User.findOne({ email: body.email });
        expect(user.refreshToken).toBe(res.body.data.refreshToken);

        // Controllare se i cookie sono stati impostati correttamente
        const cookies = res.headers['set-cookie'];
        const accessTokenCookie = cookies.find(cookie => cookie.startsWith("accessToken"));
        const refreshTokenCookie = cookies.find(cookie => cookie.startsWith("refreshToken"));

        expect(accessTokenCookie).toBeDefined();
        expect(accessTokenCookie).toContain("HttpOnly");
        expect(accessTokenCookie).toContain("Secure");
        expect(accessTokenCookie).toContain("SameSite=None");

        expect(refreshTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toContain("HttpOnly");
        expect(refreshTokenCookie).toContain("Secure");
        expect(refreshTokenCookie).toContain("SameSite=None");
    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {
        const body = {
            email: "user@example.com"
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(400);
    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const body = {
            email: "user@example.com",
            password: ""
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "At least one of the parameters in the request body is an empty string" });
    });
    test('Should return a 400 error if the email in the request body is not in a valid email format', async () => {
        const body = {
            email: "invalidemail",
            password: "password123"
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The email in the request body is not in a valid email format" });
    });
    test('Should return a 400 error if the user in the request body does not identify a user in the database', async () => {
        const body = {
            email: "nonexistent@example.com",
            password: "password123"
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The user in the request body does not identify a user in the database" });
    });
    test('Should return a 400 error if the supplied password does not match with the one in the database', async () => {
        const body = {
            email: "user@example.com",
            password: "incorrectpassword"
        };

        const res = await request(app).post('/api/login').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The supplied password does not match with the one in the database" });
    });
});

describe("logout", () => {
    beforeEach(async () => {
        await User.deleteMany();
    });

    test('Should log out a user and return a 200 response', async () => {

        const user = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const agent = request.agent(app);

        await agent.post('/api/login').set("Cookie", userCookies);

        const res = await agent.get('/api/logout').set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ data: { message: "User logged out" } });
        const to_test = await User.findOne({username: 'filippo-user'});
        expect(to_test).toBeDefined();

    });
    test('Should return a 400 error if the request does not have a refresh token in the cookies', async () => {
        const res = await request(app).get('/api/logout');
        expect(res.status).toBe(400);
    });
    test('Should return a 400 error if the refresh token in the request\'s cookies does not represent a user in the database', async () => {
        const agent = request.agent(app);

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await agent.get('/api/logout').set('Cookie', adminCookies);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ error: "The refresh token in the request's cookies does not represent a user in the database" });
    });
});

