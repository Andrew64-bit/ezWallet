import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { adminAccessTokenValid, adminRefreshTokenValid, testerAccessTokenValid, testerRefreshTokenValid } from './tokens';

dotenv.config();
beforeAll(async () => {
    const dbName = "testingDatabaseUsersOff";
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
    await Group.deleteMany({})
    await categories.deleteMany({})
    await transactions.deleteMany({})
})

describe("1: getUsers", () => {
    test("T1.1: Returns the list of all the users", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .then((response) => {
                    const expectedArray = [{
                        email: "tester@test.com",
                        username: "tester",
                        role: "Regular"
                    }, {
                        email: "admin@email.com",
                        username: "admin",
                        role: "Admin"
                    }]
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveLength(2)
                    expectedArray.forEach((expectedObject) => {
                        expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                    })
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T1.2: Returns a 401 error if called by a user who is not an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(401)
                    done()
                })
                .catch((err) => done(err))
        })
    })
})

describe("2: getUser", () => {

    test("T2.1: Returns information about a specific user when called by the same user", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users/tester")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveProperty("email", "tester@test.com")
                    expect(response.body.data).toHaveProperty("username", "tester")
                    expect(response.body.data).toHaveProperty("role", "Regular")
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T2.2: Returns information about a specific user when called by an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users/tester")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveProperty("email", "tester@test.com")
                    expect(response.body.data).toHaveProperty("username", "tester")
                    expect(response.body.data).toHaveProperty("role", "Regular")
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T2.3: Returns a 400 error if the user passed as a route parameter does not exist", (done) => {
        User.insertMany([{
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users/tester")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })

    })

    test("T2.4: Returns a 401 error if called by a user who is neither the one in the route nor an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/users/tester")
                .then((response) => {
                    expect(response.status).toBe(401)
                    done()
                })
                .catch((err) => done(err))
        })
    })
})

describe("3: createGroup", () => {

    test("T3.1: Returns information about the created group. The user calling the function is inserted among the members", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            const groupInfo = { name: "group", memberEmails: ["tester@test.com", "tester2@test.com"] }
            request(app)
                .post("/api/groups")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send(groupInfo)
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data.group).toHaveProperty("name", "group")
                    expect(response.body.data.group.members).toHaveLength(3)
                    response.body.data.group.members.forEach((m) => {
                        const isEmailIn = ["tester@test.com", "tester2@test.com", "admin@email.com"].includes(m.email)
                        expect(isEmailIn).toBe(true)
                    })
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T3.2: Returns a 400 error if called by a user who is already in a group", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.findOne({ email: "tester@test.com" })
            Group.create({
                name: "Group1",
                members: [user]
            }).then(() => {
                const groupInfo = { name: "Group2", memberEmails: ["tester2@test.com"] }
                request(app)
                    .post("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send(groupInfo)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.3: Returns a 400 error if there is already a group with the same name", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.findOne({ email: "tester@test.com" })
            Group.create({
                name: "Group1",
                members: [user]
            }).then(() => {
                const groupInfo = { name: "Group1", memberEmails: ["tester2@test.com"] }
                request(app)
                    .post("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send(groupInfo)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.4: Returns a 400 error if all the passed emails are either in a group or do not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.findOne({ email: "admin@email.com" })
            Group.create({
                name: "Group1",
                members: [user]
            }).then(() => {
                const groupInfo = { name: "Group2", memberEmails: ["tester2@test.com", "admin@email.com"] }
                request(app)
                    .post("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send(groupInfo)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.5: Returns a 400 error if there is at least one invalid email in the provided list", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.findOne({ email: "admin@email.com" })
            Group.create({
                name: "Group1",
                members: [user]
            }).then(() => {
                const groupInfo = { name: "Group2", memberEmails: ["", "testemail.com"] }
                request(app)
                    .post("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send(groupInfo)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.6: Returns a 400 error if the request body does not contain all the necessary parameters", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .post("/api/groups")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .send({})
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T3.7: Returns a 400 error if the group name in the request body is an empty string", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .post("/api/groups")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .send({ name: "", memberEmails: ["tester@email.com"] })
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T3.8: Returns a 401 error if called by a user who is not authenticated", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            const groupInfo = { name: "Group2", memberEmails: ["tester2@test.com", "admin@email.com"] }
            request(app)
                .post("/api/groups")
                .send(groupInfo)
                .then((response) => {
                    expect(response.status).toBe(401)
                    done()
                })
                .catch((err) => done(err))
        })
    })
})

describe("4: getGroups", () => {

    test("T4.1: Returns information about all the groups", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users1 = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            const users2 = await User.find({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users1
            }, {
                name: "Group2",
                members: users2
            }]).then(() => {
                request(app)
                    .get("/api/groups")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveLength(2)
                        expect(response.body.data[0]).toHaveProperty("name", "Group1")
                        expect(response.body.data[0].members).toHaveLength(2)
                        response.body.data[0].members.forEach((m) => {
                            const isEmailIn = ["tester@test.com", "tester2@test.com"].includes(m.email)
                            expect(isEmailIn).toBe(true)
                        })
                        expect(response.body.data[1]).toHaveProperty("name", "Group2")
                        expect(response.body.data[1].members).toHaveLength(1)
                        expect(response.body.data[1].members[0]).toHaveProperty("email", "tester3@test.com")
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T4.2: Returns a 401 error if called by a user who is not an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users1 = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            const users2 = await User.find({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users1
            }, {
                name: "Group2",
                members: users2
            }]).then(() => {
                request(app)
                    .get("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("5: getGroup", () => {

    test("T5.1: Returns information about a specific group when called by a member of the same group", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .get("/api/groups/Group1")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        const group = response.body.data.group ? response.body.data.group : response.body.data
                        expect(group).toHaveProperty("name", "Group1")
                        expect(group.members).toHaveLength(2)
                        group.members.forEach((m) => {
                            const isEmailIn = ["tester@test.com", "tester2@test.com"].includes(m.email)
                            expect(isEmailIn).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.2: Returns information about a specific group when called by an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .get("/api/groups/Group1")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(200)
                        const group = response.body.data.group ? response.body.data.group : response.body.data
                        expect(group).toHaveProperty("name", "Group1")
                        expect(group.members).toHaveLength(2)
                        group.members.forEach((m) => {
                            const isEmailIn = ["tester@test.com", "tester2@test.com"].includes(m.email)
                            expect(isEmailIn).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.3: Returns a 400 error if the group name passed as a route parameter does not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .get("/api/groups/Group1")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T5.4: Returns a 401 error when called by a user who is neither part of the requested group nor an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .get("/api/groups/Group1")
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("6: addToGroup", () => {

    test("T6.1: Returns updated information about the group when called by a member of the same group with the corresponding route", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/add")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.group).toHaveProperty("name", "Group1")
                        expect(response.body.data.group.members).toHaveLength(2)
                        response.body.data.group.members.forEach((m) => {
                            const isEmailIn = ["tester@test.com", "tester2@test.com"].includes(m.email)
                            expect(isEmailIn).toBe(true)
                        })
                        response.body.data.membersNotFound.forEach((m) => {
                            const stringArray = ["tester4@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester4@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        response.body.data.alreadyInGroup.forEach((m) => {
                            const stringArray = ["tester3@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester3@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T6.2: Returns updated information about the group when called by an Admin with the corresponding route", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/insert")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.group).toHaveProperty("name", "Group1")
                        expect(response.body.data.group.members).toHaveLength(2)
                        response.body.data.group.members.forEach((m) => {
                            const isEmailIn = ["tester@test.com", "tester2@test.com"].includes(m.email)
                            expect(isEmailIn).toBe(true)
                        })
                        response.body.data.membersNotFound.forEach((m) => {
                            const stringArray = ["tester4@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester4@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        response.body.data.alreadyInGroup.forEach((m) => {
                            const stringArray = ["tester3@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester3@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T6.3: Returns a 400 error if all the passed emails are either in a group or do not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                const emails = ["tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/add")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T6.4: Returns a 400 error if the group passed as a route parameter does not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            const emails = ["tester@test.com"]
            request(app)
                .patch("/api/groups/Group1/add")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ emails: emails })
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T6.5: Returns a 400 error if there is at least one invalid email among the provided list", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                const emails = ["", "tester4test.com"]
                request(app)
                    .patch("/api/groups/Group1/add")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T6.6: Returns a 400 error if the request body does not contain all the necessary parameters", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                request(app)
                    .patch("/api/groups/Group1/add")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({})
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T6.7: Returns a 401 error when called by a user who is neither part of the requested group nor an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            let user1 = await User.findOne({ email: "tester@test.com" })
            let user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: [user1]
            }, {
                name: "Group2",
                members: [user3]
            }]).then(() => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/insert")
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("7: removeFromGroup", () => {
    test("T7.1: Returns updated information about the group when called by a member of the same group with the corresponding route", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            const user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users
            }, {
                name: "Group2",
                members: [user3]
            }]).then(async () => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.group).toHaveProperty("name", "Group1")
                        expect(response.body.data.group.members).toHaveLength(1)
                        expect(response.body.data.group.members[0]).toHaveProperty("email", "tester@test.com")
                        response.body.data.membersNotFound.forEach((m) => {
                            const stringArray = ["tester4@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester4@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        response.body.data.notInGroup.forEach((m) => {
                            const stringArray = ["tester3@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester3@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.2: Returns updated information about the group when called by an Admin with the corresponding route", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            const user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users
            }, {
                name: "Group2",
                members: [user3]
            }]).then(async () => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/pull")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data.group).toHaveProperty("name", "Group1")
                        expect(response.body.data.group.members).toHaveLength(1)
                        expect(response.body.data.group.members[0]).toHaveProperty("email", "tester@test.com")
                        response.body.data.membersNotFound.forEach((m) => {
                            const stringArray = ["tester4@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester4@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        response.body.data.notInGroup.forEach((m) => {
                            const stringArray = ["tester3@test.com"].includes(m)
                            const objectArray = m.email ? m.email === "tester3@test.com" : false
                            const verified = stringArray || objectArray
                            expect(verified).toBe(true)
                        })
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.3: Returns a 400 error if all the passed emails are either not in the group or do not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: user
            }).then(() => {
                const emails = ["tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.4: Returns a 400 error if the group passed as a route parameter does not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com"] } })
            const user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group2",
                members: [user3]
            }]).then(async () => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.5: Returns a 400 error if the group contains only one member before removing any user", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com"] } })
            const user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users
            }, {
                name: "Group2",
                members: [user3]
            }]).then(async () => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.6: Returns a 400 error if there is at least one invalid email among the passed list", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: user
            }).then(() => {
                const emails = ["", "tester4test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.7: Returns a 400 error if the request body does not contain all the necessary parameters", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: user
            }).then(() => {
                const emails = ["", "tester4test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send()
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.8: Returns a 401 error when called by a user who is neither part of the requested group nor an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            const user3 = await User.findOne({ email: "tester3@test.com" })
            Group.insertMany([{
                name: "Group1",
                members: users
            }, {
                name: "Group2",
                members: [user3]
            }]).then(async () => {
                const emails = ["tester2@test.com", "tester3@test.com", "tester4@test.com"]
                request(app)
                    .patch("/api/groups/Group1/remove")
                    .send({ emails: emails })
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("8: deleteUser", () => {

    test("T8.1: Returns zero deleted transactions and confirmation that the user was in a group. The group is not deleted", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/users")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ email: "tester@test.com" })
                    .then(async (response) => {
                        const group = await Group.findOne({ name: "Group1" })
                        expect(group.members).toHaveLength(1)
                        expect(response.status).toBe(200)
                        expect(response.body.data.deletedTransactions).toBe(0)
                        expect(response.body.data.deletedFromGroup).toBe(true)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T8.2: Returns the number of deleted transactions and confirmation that the user was in a group. The group is also deleted since the user is the last in the group", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const user = await User.findOne({ email: "tester@test.com" })
            Group.create({
                name: "Group1",
                members: [user]
            }).then(() => {
                categories.create({
                    type: "food",
                    color: "red"
                }).then(() => {
                    transactions.insertMany([{
                        username: "tester",
                        type: "food",
                        amount: 20
                    }, {
                        username: "tester",
                        type: "food",
                        amount: 10
                    }]).then(() => {
                        request(app)
                            .delete("/api/users")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .send({ email: "tester@test.com" })
                            .then(async (response) => {
                                const group = await Group.findOne({ name: "Group1" })
                                expect(group).toBeNull()
                                expect(response.status).toBe(200)
                                expect(response.body.data.deletedTransactions).toBe(2)
                                expect(response.body.data.deletedFromGroup).toBe(true)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T8.3: Returns zero deleted transactions and confirmation that the user was not in a group", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .delete("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ email: "tester@test.com" })
                .then(async (response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data.deletedTransactions).toBe(0)
                    expect(response.body.data.deletedFromGroup).toBe(false)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T8.4: Returns a 400 error if the user to delete does not exist", (done) => {
        User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }).then(() => {
            request(app)
                .delete("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ email: "tester@test.com" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    done()
                })
        })
    })

    test("T8.5: Returns a 400 error if the user to delete is an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid,
            role: "Admin"
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .delete("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ email: "tester@test.com" })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T8.6: Returns a 400 error if the provided email is invalid", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .delete("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ email: "" })
                .then((response) => {
                    request(app)
                        .delete("/api/users")
                        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                        .send({ email: "testeremail.com" })
                        .then((response2) => {
                            expect(response.status).toBe(400)
                            expect(response2.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
                .catch((err) => done(err))
        })
    })

    test("T8.7: Returns a 400 error if the request body does not contain an email", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .delete("/api/users")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({})
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))

        })
    })

    test("T8.8: Returns a 401 error when called by a user who is not an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/users")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ email: "tester@test.com" })
                    .then(async (response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("9: deleteGroup", () => {
    test("T9.1: Returns a confirmation message", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/groups")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ name: "Group1" })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveProperty("message")
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T9.2: Returns a 400 error if the group to delete does not exist", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(() => {
            request(app)
                .delete("/api/groups")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ name: "Group1" })
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T9.3: Returns a 400 error if the group name in the request body is an empty string", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/groups")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ name: "" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T9.4: Returns a 400 error if the request body does not contain a group name", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/groups")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({})
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T9.5: Returns a 401 error when called by a user who is not an Admin", (done) => {
        User.insertMany([{
            username: "tester",
            email: "tester@test.com",
            password: "tester",
            refreshToken: testerRefreshTokenValid
        }, {
            username: "tester2",
            email: "tester2@test.com",
            password: "tester2",
            refreshToken: null
        }, {
            username: "tester3",
            email: "tester3@test.com",
            password: "tester3",
            refreshToken: null
        }, {
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }]).then(async () => {
            const users = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
            Group.create({
                name: "Group1",
                members: users
            }).then(() => {
                request(app)
                    .delete("/api/groups")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ name: "Group1" })
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})