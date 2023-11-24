import request from 'supertest';
import { app } from '../app';
import { categories } from '../models/model';
import { transactions } from '../models/model';
import mongoose from 'mongoose';
import {
    adminAccessTokenValid, adminRefreshTokenValid,
    testerAccessTokenValid, testerRefreshTokenValid
} from './tokens';
import dotenv from 'dotenv';
//import "jest-extended"
import { User, Group } from '../models/User';


dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseControllerOff";
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
    await categories.deleteMany({})
    await transactions.deleteMany({})
    await User.deleteMany({})
    await Group.deleteMany({})
})

describe("1: createCategory", () => {

    test("T1.1: Returns the information of the created category", (done) => {
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
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ type: "food", color: "red" })
                .then((response) => {
                    expect(response.status).toBe(200)
                    expect(response.body.data).toHaveProperty("type", "food")
                    expect(response.body.data).toHaveProperty("color", "red")
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T1.2: Returns a 400 error if the request body does not contain all the requested parameters", (done) => {
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
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({})
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T1.3: Returns a 400 error if at least one of the parameters in the request body is an empty string", (done) => {
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
                .post("/api/categories")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ type: "", color: "" })
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T1.4: Returns a 400 error if the category type in the request body exists already in the database", (done) => {
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
            categories.create({
                type: "food",
                color: "red"
            }).then(() => {
                request(app)
                    .post("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ type: "food", color: "red" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T1.5: Returns a 401 error if called by a user who is not an Admin", (done) => {
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
                .post("/api/categories")
                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                .send({ type: "food", color: "red" })
                .then((response) => {
                    expect(response.status).toBe(401)
                    done()
                })
                .catch((err) => done(err))
        })
    })
})

describe("2: updateCategory", () => {

    test("T2.1: Returns a message for confirmation and the number of updated transactions", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }]).then(() => {
                    request(app)
                        .patch("/api/categories/food")
                        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                        .send({ type: "health", color: "red" })
                        .then((response) => {
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveProperty("message")
                            expect(response.body.data).toHaveProperty("count", 2)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T2.2: Returns a 400 error if the type of the new category is the same as one that exists already and that category is not the requested one", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .patch("/api/categories/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ type: "health", color: "green" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T2.3: Returns a 400 error if the category passed in the route does not exist", (done) => {
        User.create({
            username: "admin",
            email: "admin@email.com",
            password: "admin",
            refreshToken: adminRefreshTokenValid,
            role: "Admin"
        }).then(() => {
            request(app)
                .patch("/api/categories/food")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ type: "health", color: "green" })
                .then((response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T2.4: Returns a 400 error if the request body does not contain all the necessary parameters", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .patch("/api/categories/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T2.5: Returns a 400 error if at least one of the parameters in the request body is an empty string", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .patch("/api/categories/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ type: "", color: "" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T2.6: Returns a 401 error if called by a user who is not an Admin", (done) => {
        categories.create({
            type: "food",
            color: "red"
        }).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }]).then(() => {
                    request(app)
                        .patch("/api/categories/food")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ type: "food", color: "green" })
                        .then((response) => {
                            expect(response.status).toBe(401)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })
})

describe("3: deleteCategory", () => {
    test("T3.1: Deletes the categories and updates the transactions to have the oldest category not included in those to delete", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        request(app)
                            .delete("/api/categories")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .send({ types: ["food", "travel"] })
                            .then(async (response) => {
                                const ts = await transactions.find({ type: "health" })
                                const cats = await categories.find({})
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveProperty("message")
                                expect(response.body.data).toHaveProperty("count", 4)
                                expect(cats).toHaveLength(2)
                                expect(ts).toHaveLength(5)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T3.2: Deletes the categories and updates the transactions to have the oldest category, which is not deleted", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .delete("/api/categories")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .send({ types: ["food", "travel", "health", "misc"] })
                            .then(async (response) => {
                                const ts = await transactions.find({ type: "food" })
                                const cats = await categories.find({})
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveProperty("message")
                                expect(response.body.data).toHaveProperty("count", 3)
                                expect(cats).toHaveLength(1)
                                expect(ts).toHaveLength(5)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T3.3: Returns a 400 error if there is only one category in the database", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ types: ["food"] })
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.4: Returns a 400 error if there is at least one category to delete that does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ types: ["food", "travel"] })
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.5: Returns a 400 error if the request body does not contain the necessary parameters", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.6: Returns a 400 error if the array passed in the request body is empty", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ types: [] })
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T3.7: Returns a 400 error if the array passed in the request body contains at least one empty string", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.create({
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }).then(() => {
                request(app)
                    .delete("/api/categories")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ types: [""] })
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })

        })
    })

    test("T3.8: Returns a 401 error if called by a user who is not an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        const t = await categories.find({})
                        request(app)
                            .delete("/api/categories")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .send({ types: ["food", "health"] })
                            .then(async (response) => {
                                expect(response.status).toBe(401)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })
})

describe("4: getCategories", () => {
    test("T4.1: Returns the list of all the created categories", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .get("/api/categories")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .then((response) => {
                        const expectedArray = [{
                            type: "food",
                            color: "red"
                        }, {
                            type: "health",
                            color: "blue"
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
    })

    test("T4.2: Returns a 401 error if called by a user who is not authenticated", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .get("/api/categories")
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("5: createTransaction", () => {
    test("T5.1: Returns information about the created transaction", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "tester", type: "food", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(200)
                        expect(response.body.data).toHaveProperty("username", "tester")
                        expect(response.body.data).toHaveProperty("type", "food")
                        expect(response.body.data).toHaveProperty("amount", 100)
                        expect(response.body.data).toHaveProperty("date")
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.2: Returns a 400 error if the request body does not contain the necessary parameters", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
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

    test("T5.3: Returns a 400 error if the username in the request body is not the same as the one in the route", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "admin", type: "food", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.4: Returns a 400 error if the username in the request body does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.insertMany([{
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "tester", type: "food", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.5: Returns a 400 error if the category in the request body does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "tester", type: "travel", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.6: Returns a 400 error if the amount in the request body cannot be parsed as a number", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "tester", type: "food", amount: "aaa" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.7: Returns a 400 error if at least one parameter in the request body is an empty string", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                    .send({ username: "", type: "", amount: "" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T5.8: Returns a 401 error if called by a user who is not the same as the one in the route", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                    .post("/api/users/tester/transactions")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ username: "tester", type: "health", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(401)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })
})

describe("6: getAllTransactions", () => {
    test("T6.1: Returns the list of all transactions made by all the users", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/transactions")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "food",
                                    amount: 100,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "health",
                                    amount: 15,
                                    color: "blue"
                                }, {
                                    username: "tester2",
                                    type: "travel",
                                    amount: 500
                                }, {
                                    username: "admin",
                                    type: "travel",
                                    amount: 500
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(5)
                                expectedArray.forEach((expectedObject) => {

                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T6.2: Returns a 401 error if called by a user who is not an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .then(async (response) => {
                                expect(response.status).toBe(401)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })
})

describe("7: getTransactionsByUser", () => {
    test("T7.1: Returns all the transactions made by a specific user when requested by that specific user", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "food",
                                    amount: 100,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "health",
                                    amount: 15,
                                    color: "blue"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(3)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.2: Returns all the transactions made by a specific user when requested by an admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/transactions/users/tester")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "food",
                                    amount: 100,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "health",
                                    amount: 15,
                                    color: "blue"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(3)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.3: Returns all the transactions made by a specific user when requested by that specific user filtered by amount range", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .query({ min: 15, max: 50 })
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "health",
                                    amount: 15,
                                    color: "blue"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(2)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.4: Returns all the transactions made by a specific user when requested by that specific user filtered by date range", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100,
                    date: new Date(`2023-05-10T10:00:00.000Z`)
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15,
                    date: new Date(`2023-05-05T10:00:00.000Z`)
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .query({ from: "2023-04-30", upTo: "2023-05-09" })
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "health",
                                    amount: 15,
                                    color: "blue"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(2)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.5: Returns all the transactions made by a specific user when requested by that specific user in a specific date", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100,
                    date: new Date(`2023-05-10T10:00:00.000Z`)
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15,
                    date: new Date(`2023-05-05T10:00:00.000Z`)
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .query({ date: "2023-04-30" })
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(1)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.6: Returns all the transactions made by a specific user when requested by that specific user in a specific date and in a specific amount range", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100,
                    date: new Date(`2023-05-10T10:00:00.000Z`)
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15,
                    date: new Date(`2023-05-05T10:00:00.000Z`)
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500,
                    date: new Date(`2023-04-30T10:00:00.000Z`)
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .query({ date: "2023-04-30", min: 30, max: 100 })
                            .then(async (response) => {
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(0)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T7.7: Returns a 400 error if the requested user does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.insertMany([{
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                    .get("/api/transactions/users/tester")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T7.8: Returns a 401 error if called by a user who is neither the one in the route nor an Admin", (done) => {

        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions")
                            .send({ username: "tester", type: "food", amount: "100" })
                            .then((response) => {
                                expect(response.status).toBe(401)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })

    })
})

describe("8: getTransactionsByUserByCategory", () => {
    test("T8.1: Returns all the transactions made by a specific user for a specific category when requested by that user", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions/category/food")
                            .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "food",
                                    amount: 100,
                                    color: "red"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(2)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T8.2: Returns all the transactions made by a specific user for a specific category when requested by an admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/transactions/users/tester/category/food")
                            .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                            .then(async (response) => {
                                const expectedArray = [{
                                    username: "tester",
                                    type: "food",
                                    amount: 20,
                                    color: "red"
                                }, {
                                    username: "tester",
                                    type: "food",
                                    amount: 100,
                                    color: "red"
                                }]
                                expect(response.status).toBe(200)
                                expect(response.body.data).toHaveLength(2)
                                expectedArray.forEach((expectedObject) => {
                                    expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                })
                                response.body.data.forEach((object) => {
                                    const isValidDate = !isNaN(Date.parse(object.date));
                                    expect(isValidDate).toBe(true);
                                })
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })

    test("T8.3: Returns a 400 error if the requested user does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.insertMany([{
                username: "admin",
                email: "admin@email.com",
                password: "admin",
                refreshToken: adminRefreshTokenValid,
                role: "Admin"
            }]).then(() => {
                request(app)
                    .get("/api/transactions/users/tester/category/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .send({ username: "tester", type: "food", amount: "100" })
                    .then((response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T8.4: Returns a 400 error if the requested category does not exist", (done) => {
        categories.insertMany([{
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                request(app)
                    .get("/api/transactions/users/tester/category/food")
                    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                    .then(async (response) => {
                        expect(response.status).toBe(400)
                        done()
                    })
                    .catch((err) => done(err))
            })
        })
    })

    test("T8.5: Returns a 401 error if called by a user who is neither the one in the route nor an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
            }, {
                username: "tester2",
                email: "tester2@test.com",
                password: "tester2",
                refreshToken: null
            }]).then(() => {
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(() => {
                        request(app)
                            .get("/api/users/tester/transactions/category/food")
                            .send({ username: "tester", type: "food", amount: "100" })
                            .then((response) => {
                                expect(response.status).toBe(401)
                                done()
                            })
                            .catch((err) => done(err))
                    })
                })
            })
        })
    })
})

describe("9: getTransactionsByGroup", () => {
    test("T9.1: Returns all the transactions made by members of a specific group when requested by a member of the group", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
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
                                .get("/api/groups/Group1/transactions")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then(async (response) => {
                                    const expectedArray = [{
                                        username: "tester",
                                        type: "food",
                                        amount: 20,
                                        color: "red"
                                    }, {
                                        username: "tester",
                                        type: "food",
                                        amount: 100,
                                        color: "red"
                                    }, {
                                        username: "tester2",
                                        type: "travel",
                                        amount: 500
                                    }, {
                                        username: "tester",
                                        type: "health",
                                        amount: 15
                                    }]
                                    expect(response.status).toBe(200)
                                    expect(response.body.data).toHaveLength(4)
                                    expectedArray.forEach((expectedObject) => {
                                        expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                    })
                                    response.body.data.forEach((object) => {
                                        const isValidDate = !isNaN(Date.parse(object.date));
                                        expect(isValidDate).toBe(true);
                                    })
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T9.2: Returns all the transactions made by members of a specific group when requested by an admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
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
                                .get("/api/transactions/groups/Group1")
                                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                                .then(async (response) => {
                                    const expectedArray = [{
                                        username: "tester",
                                        type: "food",
                                        amount: 20,
                                        color: "red"
                                    }, {
                                        username: "tester",
                                        type: "food",
                                        amount: 100,
                                        color: "red"
                                    }, {
                                        username: "tester2",
                                        type: "travel",
                                        amount: 500
                                    }, {
                                        username: "tester",
                                        type: "health",
                                        amount: 15
                                    }]
                                    expect(response.status).toBe(200)
                                    expect(response.body.data).toHaveLength(4)
                                    expectedArray.forEach((expectedObject) => {
                                        expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                    })
                                    response.body.data.forEach((object) => {
                                        const isValidDate = !isNaN(Date.parse(object.date));
                                        expect(isValidDate).toBe(true);
                                    })
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T9.3: Returns a 400 error if the requested group does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        const users1 = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
                        const users2 = await User.find({ email: "tester3@test.com" })
                        Group.insertMany([{
                            name: "Group2",
                            members: users2
                        }]).then(() => {
                            request(app)
                                .get("/api/groups/Group1/transactions")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then((response) => {
                                    expect(response.status).toBe(400)
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T9.4: Returns a 401 error if called by a user who is neither part of the group nor an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        const users1 = await User.find({ email: { $in: ["tester2@test.com"] } })
                        const users2 = await User.find({ email: "tester3@test.com" })
                        Group.insertMany([{
                            name: "Group1",
                            members: users1
                        }, {
                            name: "Group2",
                            members: users2
                        }]).then(() => {
                            request(app)
                                .get("/api/groups/Group1/transactions")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then(async (response) => {
                                    expect(response.status).toBe(401)
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })
})

describe("10: getTransactionsByGroupByCategory", () => {
    test("T10.1: Returns all the transactions made by members of a specific group for a specific category when requested by a member of the group", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
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
                                .get("/api/groups/Group1/transactions/category/food")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then(async (response) => {
                                    const expectedArray = [{
                                        username: "tester",
                                        type: "food",
                                        amount: 20,
                                        color: "red"
                                    }, {
                                        username: "tester",
                                        type: "food",
                                        amount: 100,
                                        color: "red"
                                    }]
                                    expect(response.status).toBe(200)
                                    expect(response.body.data).toHaveLength(2)
                                    expectedArray.forEach((expectedObject) => {
                                        expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                    })
                                    response.body.data.forEach((object) => {
                                        const isValidDate = !isNaN(Date.parse(object.date));
                                        expect(isValidDate).toBe(true);
                                    })
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T10.2: Returns all the transactions made by members of a specific group when requested by an admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
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
                                .get("/api/transactions/groups/Group1/category/food")
                                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                                .then(async (response) => {
                                    const expectedArray = [{
                                        username: "tester",
                                        type: "food",
                                        amount: 20,
                                        color: "red"
                                    }, {
                                        username: "tester",
                                        type: "food",
                                        amount: 100,
                                        color: "red"
                                    }]
                                    expect(response.status).toBe(200)
                                    expect(response.body.data).toHaveLength(2)
                                    expectedArray.forEach((expectedObject) => {
                                        expect(response.body.data).toContainEqual(expect.objectContaining(expectedObject));
                                    })
                                    response.body.data.forEach((object) => {
                                        const isValidDate = !isNaN(Date.parse(object.date));
                                        expect(isValidDate).toBe(true);
                                    })
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T10.3: Returns a 400 error if the requested group does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        const users1 = await User.find({ email: { $in: ["tester@test.com", "tester2@test.com"] } })
                        const users2 = await User.find({ email: "tester3@test.com" })
                        Group.insertMany([{
                            name: "Group2",
                            members: users2
                        }]).then(() => {
                            request(app)
                                .get("/api/groups/Group1/transactions/category/food")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then((response) => {
                                    expect(response.status).toBe(400)
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T10.4: Returns a 400 error if the requested category does not exist", (done) => {
        categories.insertMany([{
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
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
                                .get("/api/groups/Group1/transactions/category/food")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then((response) => {
                                    expect(response.status).toBe(400)
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })

    test("T10.5: Returns a 401 error if called by a user who is neither part of the group nor an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester",
                    type: "food",
                    amount: 20
                }, {
                    username: "tester",
                    type: "food",
                    amount: 100
                }, {
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(() => {
                    categories.insertMany([{
                        type: "travel",
                        color: "green"
                    }, {
                        type: "misc",
                        color: "yellow"
                    }]).then(async () => {
                        const users1 = await User.find({ email: { $in: ["tester2@test.com"] } })
                        const users2 = await User.find({ email: "tester3@test.com" })
                        Group.insertMany([{
                            name: "Group1",
                            members: users1
                        }, {
                            name: "Group2",
                            members: users2
                        }]).then(() => {
                            request(app)
                                .get("/api/groups/Group1/transactions/category/food")
                                .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                                .then(async (response) => {
                                    expect(response.status).toBe(401)
                                    done()
                                })
                                .catch((err) => done(err))
                        })

                    })
                })
            })
        })
    })
})

describe("11: deleteTransaction", () => {
    test("T11.1: Returns a message confirming successful deletion", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const transaction = await transactions.findOne({ username: "tester", type: "health", amount: 15 })
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _id: transaction._id })
                        .then(async (response) => {
                            const tran = await transactions.findOne({ _id: transaction._id })
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveProperty("message")
                            expect(tran).toBeNull()
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.2: Returns a 400 error if the requested user does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
            User.insertMany([{
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const transaction = await transactions.findOne({ username: "tester", type: "health", amount: 15 })
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _id: transaction._id })
                        .then((response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.3: Returns a 400 error if the transaction to delete does not exist", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const transaction = await transactions.findOne({ username: "tester", type: "health", amount: 15 })
                    await transactions.deleteOne({ _id: transaction._id })
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _id: transaction._id })
                        .then((response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.4: Returns a 400 error if the request body does not contain the necessary parameter", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .then((response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.5: Returns a 400 error if the transaction id in the request body is an empty string", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _id: "" })
                        .then((response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.6: Returns a 400 error if the transaction does not belong to the calling user", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const transaction = await transactions.findOne({ username: "tester2", type: "travel", amount: 500 })
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _id: transaction._id })
                        .then(async (response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T11.7: Returns a 401 error if called by a user who is not the same as the one in the route", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const transaction = await transactions.findOne({ username: "tester", type: "health", amount: 15 })
                    request(app)
                        .delete("/api/users/tester/transactions")
                        .send({ _id: transaction._id })
                        .then((response) => {
                            expect(response.status).toBe(401)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })
})

describe("12: deleteTransactions", () => {
    test("T12.1: Returns a message confirming successful deletion", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const trs = await transactions.find({ type: "travel" })
                    const ids = []
                    trs.forEach((t) => ids.push(t._id))
                    request(app)
                        .delete("/api/transactions")
                        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                        .send({ _ids: ids })
                        .then(async (response) => {
                            const tran = await transactions.find({ _id: { $in: ids } })
                            expect(response.status).toBe(200)
                            expect(response.body.data).toHaveProperty("message")
                            expect(tran).toHaveLength(0)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T12.2: Returns a 400 error if at least one of the ids passed in the request body does not represent a transaction", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const trs = await transactions.find({ type: "travel" })
                    const ids = []
                    trs.forEach((t) => ids.push(t._id))
                    await transactions.deleteOne({ _id: ids[0] })
                    request(app)
                        .delete("/api/transactions")
                        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                        .send({ _ids: ids })
                        .then(async (response) => {
                            expect(response.status).toBe(400)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })

    test("T12.3: Returns a 400 error if the request body does not contain the array of ids", (done) => {
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
                .delete("/api/transactions")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({})
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T12.4: Returns a 400 error if the array in the request body contains at least one empty string", (done) => {
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
                .delete("/api/transactions")
                .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminRefreshTokenValid}`)
                .send({ _ids: [""] })
                .then(async (response) => {
                    expect(response.status).toBe(400)
                    done()
                })
                .catch((err) => done(err))
        })
    })

    test("T12.5: Returns a 401 error if called by a user who is not an Admin", (done) => {
        categories.insertMany([{
            type: "food",
            color: "red"
        }, {
            type: "health",
            color: "blue"
        }]).then(() => {
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
                transactions.insertMany([{
                    username: "tester2",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester",
                    type: "health",
                    amount: 15
                }, {
                    username: "admin",
                    type: "travel",
                    amount: 500
                }, {
                    username: "tester3",
                    type: "misc",
                    amount: 17
                }]).then(async () => {
                    const trs = await transactions.find({ type: "travel" })
                    const ids = []
                    trs.forEach((t) => ids.push(t._id))
                    request(app)
                        .delete("/api/transactions")
                        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerRefreshTokenValid}`)
                        .send({ _ids: ids })
                        .then((response) => {
                            expect(response.status).toBe(401)
                            done()
                        })
                        .catch((err) => done(err))
                })
            })
        })
    })
})