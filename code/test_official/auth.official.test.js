import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import { response } from 'express';
import { testerAccessTokenValid, testerRefreshTokenValid } from './tokens';

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseAuthOff";
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

beforeEach(async () => {
    await User.deleteMany({})
})

describe("1: register", () => {
    test("T1.1: Returns a message confirming successful creation", (done) => {
        request(app)
            .post("/api/register")
            .send({ username: "tester", email: "tester@test.com", password: "tester" })
            .then(async (response) => {
                const createdUser = await User.findOne({ username: "tester" })
                expect(createdUser).toHaveProperty("username", "tester")
                expect(createdUser).toHaveProperty("email", "tester@test.com")
                expect(createdUser).toHaveProperty("password")
                expect(createdUser).toHaveProperty("role", "Regular")
                expect(response.status).toBe(200)
                expect(response.body.data).toHaveProperty("message")
                done()
            })
    })

    test("T1.2: Returns a 400 error if the request body does not contain all the parameters", (done) => {
        request(app)
            .post("/api/register")
            .send({ username: "", email: "", password: "" })
            .then(async (response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })

    test("T1.3: Returns a 400 error if the email passed in the request body is already in use", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester"
        }).then(() => {
            request(app)
                .post("/api/register")
                .send({ username: "tester2", email: "tester@test.com", password: "tester" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })

    test("T1.4: Returns a 400 error if the username passed in the request body is already in use", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester"
        }).then(() => {
            request(app)
                .post("/api/register")
                .send({ username: "tester", email: "tester2@test.com", password: "tester" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })

    test("T1.5: Returns a 400 error if the email passed in the request body is invalid", (done) => {
        request(app)
            .post("/api/register")
            .send({ username: "tester", email: "testeremail.com", password: "tester" })
            .then(async (response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })
})

describe("2: registerAdmin", () => {
    test("T2.1: Returns a message confirming successful creation", (done) => {
        request(app)
            .post("/api/admin")
            .send({ username: "tester", email: "tester@test.com", password: "tester" })
            .then(async (response) => {
                const createdUser = await User.findOne({ username: "tester" })
                expect(createdUser).toHaveProperty("username", "tester")
                expect(createdUser).toHaveProperty("email", "tester@test.com")
                expect(createdUser).toHaveProperty("password")
                expect(createdUser).toHaveProperty("role", "Admin")
                expect(response.status).toBe(200)
                expect(response.body.data).toHaveProperty("message")
                done()
            })
    })

    test("T2.2: Returns a 400 error if the request body does not contain all the parameters", (done) => {
        request(app)
            .post("/api/admin")
            .send({ username: "", email: "", password: "" })
            .then(async (response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })

    test("T2.3: Returns a 400 error if the email passed in the request body is already in use", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester"
        }).then(() => {
            request(app)
                .post("/api/admin")
                .send({ username: "tester2", email: "tester@test.com", password: "tester" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })

    test("T2.4: Returns a 400 error if the username passed in the request body is already in use", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester"
        }).then(() => {
            request(app)
                .post("/api/admin")
                .send({ username: "tester", email: "tester2@test.com", password: "tester" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })

    test("T2.5: Returns a 400 error if the email passed in the request body is invalid", (done) => {
        request(app)
            .post("/api/admin")
            .send({ username: "tester2", email: "testertest.com", password: "tester" })
            .then(async (response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })
})

describe("3: login", () => {
    test("T3.1: Returns the created access and refresh tokens for allowing authentication", (done) => {
        bcrypt.hash("tester", 12).then((hashedPassword) => {
            User.create({
                username: "tester",
                email: "tester@test.com",
                password: hashedPassword
            }).then(() => {
                request(app)
                    .post("/api/login")
                    .send({ email: "tester@test.com", password: "tester" })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveProperty("accessToken")
                        expect(response.body.data).toHaveProperty("refreshToken")
                        const accessToken = jwt.verify(response.body.data.accessToken, process.env.ACCESS_KEY)
                        const refreshToken = jwt.verify(response.body.data.refreshToken, process.env.ACCESS_KEY)
                        expect(accessToken).toHaveProperty("email", "tester@test.com")
                        expect(accessToken).toHaveProperty("username", "tester")
                        expect(accessToken).toHaveProperty("role", "Regular")
                        expect(refreshToken).toHaveProperty("email", "tester@test.com")
                        expect(refreshToken).toHaveProperty("username", "tester")
                        expect(refreshToken).toHaveProperty("role", "Regular")
                        done()
                    })
            })
        })
    })

    test("T3.2: Returns a 400 error if the request body does not contain all the requested parameters", (done) => {
        request(app)
            .post("/api/login")
            .send({ email: "", password: "" })
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })

    test("T3.3: Returns a 400 error if the email in the request body does not belong to a user", (done) => {
        request(app)
            .post("/api/login")
            .send({ email: "tester@test.com", password: "tester" })
            .then((response) => {
                expect(response.status).toBe(400)
                expect(response.body).toHaveProperty("error")
                done()
            })
    })

    test("T3.4: Returns a 400 error if the provided password does not match with the one in the database", (done) => {
        bcrypt.hash("tester", 12).then((hashedPassword) => {
            User.create({
                username: "tester",
                email: "tester@test.com",
                password: hashedPassword
            }).then(() => {
                request(app)
                    .post("/api/login")
                    .send({ email: "tester@test.com", password: "tester2" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body).toHaveProperty("error")
                        done()
                    })
            })
        })
    })

    test("T3.5: Returns a 400 error if the email in the request body is invalid", (done) => {
        bcrypt.hash("tester", 12).then((hashedPassword) => {
            User.create({
                username: "tester",
                email: "tester@test.com",
                password: hashedPassword
            }).then(() => {
                request(app)
                    .post("/api/login")
                    .send({ email: "testertest.com", password: "tester" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        expect(response.body).toHaveProperty("error")
                        done()
                    })
            })
        })
    })
})

describe("4: logout", () => {
    test("T4.1: Returns a confirmation message", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }).then(() => {
            request(app)
                .get("/api/logout")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .then(async (response) => {
                    const user = await User.findOne({ email: "tester@test.com" })
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveProperty("message")
                    expect(user.refreshToken).toBeNull()
                    done()
                })
        })
    })

    test("T4.2: Returns a 400 error if called without a refresh token in the cookies", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }).then(() => {
            request(app)
                .get("/api/logout")
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })

    test("T4.3: Returns a 400 error if the refresh token in the cookies does not identify a user", (done) => {
        User.create({
            username: "tester",
            email: "tester@test.com",
            password: "tester"
        }).then(() => {
            request(app)
                .get("/api/logout")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    expect(response.body).toHaveProperty("error")
                    done()
                })
        })
    })
})