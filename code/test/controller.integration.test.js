import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import {Group, User} from "../models/User.js";
import {getTransactionsByUser} from "../controllers/controller.js";
import * as auth from "../controllers/auth.js";
import {login, register, registerAdmin} from "../controllers/auth.js";

dotenv.config();

beforeAll(async () => {
    const dbName = "testingDatabaseController";
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

// noinspection SpellCheckingInspection
const adminAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzgyOTMsImV4cCI6MTcxNzYxNDMwMSwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.6yWTA63eMapfh_rhh1BLWuFyWqU_6N8j5kKB-Qgmwf0";
const userAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1MDksImV4cCI6MTcxNzYxNDUxMCwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.trCxraFlVYofXulZHkNhxFyeM_3JyW8Mw-_E_c7aYRI";
const adminRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg0MTAsImV4cCI6MTcxNzYxNDQxMiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.lYjWcduhkdj39MEEs1U-I1rVgl5kZ46rHizN7EQetU8";
const userRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1NTEsImV4cCI6MTcxNzYxNDU1MiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.B31B-rwRUHwq_b_3YPWmnWg6vg6cpuQpH2GWld0Z1jY";

let adminCookies = `${adminAccessToken}; ${adminRefreshToken}`;
let userCookies = `${userAccessToken}; ${userRefreshToken}`;


describe("createCategory", () => {

    /* clean up the categories in the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await User.deleteMany();
    });

    test('Should return a 200 response and an object category in json format', async () => {

        const body =  {
            type: "new-category",
            color: "blue",
        }

        /* let's await the response */
        const res = await request(app).post('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data).toEqual(body);
        /* check if the db contain the desired elements */
        const createdCategory = await categories.findOne({ type: res.body.data.type });
        expect(createdCategory).toBeDefined();
        expect(createdCategory.type).toBe(body.type);
        expect(createdCategory.color).toBe(body.color);

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        const body =  {
            type: "new-category",
        }

        /* let's await the response */
        const res = await request(app).post('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({error: "Request body does not contain the necessary attributes"});

    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {

        const body =  {
            type: "new-category",
            color: "", // empty string
        }

        /* let's await the response */
        const res = await request(app).post('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({error: "Parameters cannot be empty strings"});

    });
    test('Should return a 400 error if the type of category passed in the request body represents an already existing category in the database', async () => {

        const body =  {
            type: "new-category",
            color: "blue",
        }

        await categories.create(body);

        /* let's await the response */
        const res = await request(app).post('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({error: "The category already exists"});

    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        const body =  {
            type: "new-category",
            color: "blue",
        }

        await categories.create(body);

        /* let's await the response */
        const res = await request(app).post('/api/categories').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({error: "Admin authority needed"});

    });
})

describe("updateCategory", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
    });

    test('Should return a 200 response and a message that confirms successful editing and a parameter count that is equal to the count of transactions whose category was changed with the new type', async () => {

        const body =  {
            type: "new-category-name",
            color: "blue",
        }

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "old-category-to-change",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "old-category-to-change",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "old-category-to-change",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        /* insert new category inside db and populate tree transaction with it */
        await categories.create({
            type: "old-category-to-change",
            color: "bluette",
        });

        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).patch('/api/categories/old-category-to-change').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Category edited successfully");
        expect(res.body.data.count).toEqual(3);
        /* check if the db contain the desired elements */
        const newCategory = await categories.findOne({ type: body.type });
        const updatedTransactions = await transactions.find({ type: "new-category-name" });
        expect(newCategory).toBeDefined();
        expect(updatedTransactions).toBeDefined();
        expect(newCategory.type).toBe(body.type);
        expect(newCategory.color).toBe(body.color);
        expect(updatedTransactions.length).toBe(3);

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        const body =  {
            type: "new-category-name",
        }

        /* let's await the response */
        const res = await request(app).patch('/api/categories/old-category-to-change').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("Request body does not contain the necessary attributes");

    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {

        const body =  {
            type: "new-category-name",
            color: "" // empty string
        }

        /* let's await the response */
        const res = await request(app).patch('/api/categories/old-category-to-change').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("Parameters cannot be empty strings");

    });
    test('Should return a 400 error if at least one of the parameters in the request body is not a string', async () => {

        const body =  {
            type: "new-category-name",
            color: 12 // not a string
        }

        /* let's await the response */
        const res = await request(app).patch('/api/categories/old-category-to-change').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the type of category passed as a route parameter does not represent a category in the database', async () => {

        const body =  {
            type: "new-category-name",
            color: "color",
        }

        /* let's await the response */
        const res = await request(app).patch('/api/categories/no-exist').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("The category to update does not exists");

    });
    test('Should return a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database', async () => {

        const body =  {
            type: "new-category-name",
            color: "color",
        }

        await categories.create({
            type: body.type,
            color: "bluette",
        });


        /* let's await the response */
        const res = await request(app).patch('/api/categories/new-category-name').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("The new category you specified in the request is already present in the db.");

    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        const body =  {
            type: "new-category-name",
            color: "color",
        }

        await categories.create({
            type: "some-else",
            color: "bluette",
        });


        /* let's await the response */
        const res = await request(app).patch('/api/categories/new-category-name').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({error: "Admin authority needed"});

    });

})

describe("deleteCategory", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
    });

    test('Default behavior, should respond with an object with an attribute `message` that confirms successful deletion and an attribute `count` that specifies the number of transactions that have had their category type changed, and a 200 response code', async () => {

        const body = {
            types: ["to_delete_1", "to_delete_2"],
        }

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete_1",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            },
            {
                type: "investment-2",
                color: "black",
            },
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete_1",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete_1",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Categories deleted successfully");
        expect(res.body.data.count).toBe(3);
        /* check if the db contain the desired elements */
        const deleted_1 = await categories.findOne({ type: "to_delete_1"});
        const deleted_2 = await categories.findOne({ type: "to_delete_2"});
        const updatedTransactions = await transactions.find({ type: "investment" });
        expect(deleted_1).toBeNull();
        expect(deleted_2).toBeNull();
        expect(updatedTransactions).toBeDefined();
        expect(updatedTransactions.length).toBe(4);

    });
    test('Default behavior, with only one element', async () => {

        const body = {
            types: "to_delete_1",
        }

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete_1",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            },
            {
                type: "investment-2",
                color: "black",
            },
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete_1",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete_1",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Categories deleted successfully");
        expect(res.body.data.count).toBe(2);
        /* check if the db contain the desired elements */
        const deleted_1 = await categories.findOne({ type: "to_delete_1"});
        const deleted_2 = await categories.findOne({ type: "to_delete_2"});
        const updatedTransactions = await transactions.find({ type: "investment" });
        expect(deleted_1).toBeNull();
        expect(updatedTransactions).toBeDefined();
        expect(updatedTransactions.length).toBe(3);

    });
    test('Default behavior, case N > T but T contains the oldest category', async () => {

        const body = {
            types: ["investment", "to_delete_2"],
        }

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete_1",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            },
            {
                type: "investment-2",
                color: "black",
            },
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete_1",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete_1",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Categories deleted successfully");
        expect(res.body.data.count).toBe(2);
        /* check if the db contain the desired elements */
        const deleted_1 = await categories.findOne({ type: "investment"});
        const deleted_2 = await categories.findOne({ type: "to_delete_2"});
        const updatedTransactions = await transactions.find({ type: "to_delete_1" });
        expect(deleted_1).toBeNull();
        expect(deleted_2).toBeNull();
        expect(updatedTransactions).toBeDefined();
        expect(updatedTransactions.length).toBe(4);

    });
    test('Default behavior, but the case N = T', async () => {

        const body = {
            types: ["investment", "to_delete_1", "to_delete_2"],
        }

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete_1",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            }
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete_1",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete_1",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Categories deleted successfully");
        expect(res.body.data.count).toBe(3);
        /* check if the db contain the desired elements */
        const deleted_1 = await categories.findOne({ type: "to_delete_1"});
        const deleted_2 = await categories.findOne({ type: "to_delete_2"});
        const not_deleted = await categories.findOne({ type: "investment"});
        const updatedTransactions = await transactions.find({ type: "investment" });
        expect(deleted_1).toBeNull();
        expect(deleted_2).toBeNull();
        expect(not_deleted).toBeDefined();
        expect(updatedTransactions).toBeDefined();
        expect(updatedTransactions.length).toBe(4);

    });
    test('Default behavior, but only one category', async () => {

        const body = {
            types: ["to_delete"],
        }

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            }
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data.message).toEqual("Categories deleted successfully");
        expect(res.body.data.count).toBe(2);
        /* check if the db contain the desired elements */
        const deleted = await categories.findOne({ type: "to_delete"});
        const not_deleted = await categories.findOne({ type: "investment"});
        const updatedTransactions = await transactions.find({ type: "investment" });
        expect(deleted).toBeNull();
        expect(not_deleted).toBeDefined();
        expect(updatedTransactions).toBeDefined();
        expect(updatedTransactions.length).toBe(3);

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        const body = {
        }

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("Request body don't contain anything");

    });
    test('Should return a 400 error if called when there is only one category in the database', async () => {

        const body = {
            types: ["to_delete"],
        }

        const to_insert_categories = [
            {
                type: "to_delete",
                color: "black",
            }
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("You cannot call this method if there is only one category in the db");

    });
    test('Should return a 400 error if at least one of the types in the array is an empty string', async () => {

        const body = {
            types: ["to_delete", ""],
        }

        const to_insert_categories = [
            {
                type: "to_delete",
                color: "black",
            },
            {
                type: "to_delete-2",
                color: "black",
            }
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("Categories cannot be empty strings");

    });
    test('Should return a 400 error if the single category is an empty string', async () => {

        const body = {
            types: "",
        }

        const to_insert_categories = [
            {
                type: "to_delete",
                color: "black",
            },
            {
                type: "to_delete-2",
                color: "black",
            }
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("Request body types cannot be empty");

    });
    test('Should return a 400 error if at least one of the types in the array does not represent a category in the database', async () => {

        const body = {
            types: ["to_delete", "not-present"],
        }

        const to_insert_categories = [
            {
                type: "to_delete",
                color: "black",
            },
            {
                type: "to_delete-2",
                color: "black",
            },
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("The category does not exist");

    });
    test('Should return a 400 error if the single category does not represent a category in the database', async () => {

        const body = {
            types: "not-present"
        }

        const to_insert_transactions = [
            {
                username: "Alice",
                type: "investment",
                amount: 100,
                date: new Date("2023-06-01")
            },
            {
                username: "Bob",
                type: "to_delete",
                amount: 200,
                date: new Date("2023-06-02")
            },
            {
                username: "Charlie",
                type: "to_delete",
                amount: 300,
                date: new Date("2023-06-03")
            },
            {
                username: "Rose",
                type: "to_delete_2",
                amount: 300,
                date: new Date("2023-06-03")
            }
        ];

        await transactions.insertMany(to_insert_transactions);

        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual("The category does not exist");

    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        const body =  {
            type: "some",
        }


        /* let's await the response */
        const res = await request(app).delete('/api/categories').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({error: "Admin authority needed"});

    });
});

describe("getCategories", () => {

    /* clean up the categories in the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
    });

    test('Should return a response `data`: An array of objects, each one having attributes `type` and `color`', async () => {

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "to_delete_1",
                color: "black",
            },
            {
                type: "to_delete_2",
                color: "black",
            },
            {
                type: "investment-2",
                color: "black",
            },
        ];

        await categories.insertMany(to_insert_categories);


        const res = await request(app).get('/api/categories').set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        /* expect(res.body).toEqual({
            data: to_insert_categories,
            refreshedTokenMessage: "Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls"
        }); */
        expect(res.body.data).toEqual(to_insert_categories);
    });
    test('Returns a 401 error if called by a user who is not authenticated (authType = Simple)', async () => {

        const res = await request(app).get('/api/categories').set("Cookie", "noLoggedUser");

        /* let's test the expected behavior */
        expect(res.status).toEqual(401);
        expect(res.body).toEqual({
            error: "Unauthorized"
        });
    });
})

describe("createTransaction", () => {
    /* clean up the categories in the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await User.deleteMany();
        await transactions.deleteMany();
    });

    test('Default case', async () => {

        const body = {
            username: "filippo-user",
            amount: 100,
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(200);
        expect(res.body.data).toBeDefined();

        /* check if the transaction is present */
        const tran = await transactions.findOne({type: "food"});
        expect(tran).toBeDefined();

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        const body = {
            username: "filippo-user",
            amount: 100,
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {

        const body = {
            username: "filippo-user",
            amount: 100,
            type: ""
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the type of category passed in the request body does not represent a category in the database', async () => {

        const body = {
            username: "filippo-user",
            amount: 100,
            type: "not-present"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s',
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the username passed in the request body is not equal to the one passed as a route parameter', async () => {

        const body = {
            username: "filippo",
            amount: 100,
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        await User.create({
            username: 'filippo',
            email: 'filippo@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the username passed in the request body does not represent a user in the database', async () => {

        const body = {
            username: "filippo",
            amount: 100,
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s',
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the username passed as a route parameter does not represent a user in the database', async () => {

        const body = {
            username: "filippo-user",
            amount: 100,
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s',
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted)', async () => {

        const body = {
            username: "filippo-user",
            amount: "some",
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(400);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 401 error if called by an authenticated user who is not the same user as the one in the route parameter (authType = User)', async () => {

        const body = {
            username: "filippo-user",
            amount: "100",
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", adminCookies);

        /* let's test the expected behavior */
        expect(res.status).toEqual(401);
        expect(res.body.error).toBeDefined();

    });
    test('Should return a 401 error if called by an user not authenticated', async () => {

        const body = {
            username: "filippo-user",
            amount: "100",
            type: "food"
        }

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'Some'
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });

        await categories.create({
            type: "food",
            color: "black"
        });

        /* let's await the response */
        const res = await request(app).post('/api/users/filippo-user/transactions').send(body).set("Cookie", "noCookies");

        /* let's test the expected behavior */
        expect(res.status).toEqual(401);
        expect(res.body.error).toBeDefined();

    });
})

describe("getAllTransactions", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
    });

    test('Default test', async () => {

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "Alice",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "Bob",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "Charlie",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "Rose",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "Alice",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
                color: "black"
            },
            {
                username: "Bob",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
                color: "black"
            },
            {
                username: "Charlie",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            },
            {
                username: "Rose",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            }
        ];

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/transactions').set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        const res = await request(app).get('/api/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();

    });
})

describe("getTransactionsByUser", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
    });

    test('Default behavior, admin case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/transactions/users/filippo-admin').set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Default behavior, user case with no filters', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/users/filippo-user/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Default behavior, user case with filters', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 90,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 400,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 500,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 620,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 400,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 500,
                type: "investment",
                date: new Date("2023-06-01"),
            },
        ];

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/users/filippo-user/transactions').set("Cookie", userCookies).query({ min: 100, max: 600 });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Default behavior, user case with filters case minAmount', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 90,
                color: 'black',
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                color: 'black',
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];
        const to_check_transactions = [
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/users/filippo-user/transactions').set("Cookie", userCookies).query({ min: 100});

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Default behavior, user case with filters case maxAmount', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];
        const to_check_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            }
        ];

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/users/filippo-user/transactions').set("Cookie", userCookies).query({ max: 200 });

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Should return a 401 error if called by a user not auth', async () => {

        /* populate the db */

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await request(app).get('/api/users/filippo-user/transactions?minAmount=100&maxAmount=600').set("Cookie", "userCookies");

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
    test('Should return a 400 error if the username passed as a route parameter does not represent a user in the database', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await request(app).get('/api/users/filippo-user-temp/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken.replace("refreshToken=", ""),
            role: 'Admin'
        });

        const res = await request(app).get('/api/users/filippo-user/transactions').set("Cookie", adminCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 if the route is admin but the user is not an admin', async () => {

        /* populate the db */
        await categories.create({
            type: "some",
            color: "some"
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await request(app).get('/api/transactions/users/filippo-admin').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
});

describe("getTransactionsByUserByCategory", () => {
    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
    });

    test('Default behavior, admin case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment-2",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
        ];

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/transactions/users/filippo-admin/category/investment-2').set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Default behavior, user case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-user",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];

        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);

        const res = await request(app).get('/api/users/filippo-user/transactions/category/investment').set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );
    });
    test('Should return a 400 error if the username passed as a route parameter does not represent a user in the database', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        await categories.create({
            type: "some",
            color: "some"
        });

        const res = await request(app).get('/api/users/filippo/transactions/category/some').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 400 error if the category passed as a route parameter does not represent a user in the database', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await request(app).get('/api/users/filippo-user/transactions/category/some').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken.replace("refreshToken=", ""),
            role: 'Admin'
        });

        await categories.create({
            type: "some",
            color: "some"
        });

        const res = await request(app).get('/api/users/filippo-user/transactions/category/some').set("Cookie", adminCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 error if called by a user not authenticated', async () => {


        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken.replace("refreshToken=", ""),
            role: 'Admin'
        });

        await categories.create({
            type: "some",
            color: "some"
        });

        const res = await request(app).get('/api/users/filippo-user/transactions/category/some').set("Cookie", "adminCookies");

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 if the route is admin but the user is not an admin', async () => {

        /* populate the db */
        await categories.create({
            type: "some",
            color: "some"
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const res = await request(app).get('/api/transactions/users/filippo-user/category/some').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();
    });
})

describe("getTransactionsByGroup", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
        await Group.deleteMany();
    });

    test('Default behavior, admin case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            },
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
                color: "black"
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
                color: "black"
            },
        ];
        const admin_user = await User.create({
                username: 'filippo-admin',
                email: 'filippo-admin@somedomain.com',
                password: 'password123',
                refreshToken: adminRefreshToken,
                role: 'Admin'
            });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-1').set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );


    });
    test('Default behavior, user case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            },
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
                color: "black"
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
                color: "black"
            },
        ];
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/groups/testing-group-1/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );


    });
    test('Should return a 400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/groups/testing-group-3/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions`', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            },
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
                color: "black"
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
                color: "black"
            },
        ];
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/groups/testing-group-2/transactions').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();


    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name`', async () => {

        /* populate the db */
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-1').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined()

    });
})

describe("getTransactionsByGroupByCategory", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
        await Group.deleteMany();
    });

    test('Default behavior, admin case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment-2",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
        ];
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-1/category/investment').set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );


    });
    test('Default behavior, user case', async () => {

        /* populate the db */
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment-2",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
        ];
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/groups/testing-group-1/transactions/category/investment').set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject(
            to_check_transactions.map(transaction => ({
                ...transaction,
                date: transaction.date.toISOString()
            }))
        );


    });
    test('Should return a 400 error if the group name passed as a route parameter does not represent a group in the database', async () => {
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-3/category/investment').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 400 error if the category type passed as a route parameter does not represent a type in the database', async () => {
        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-1/category/investment-3').set("Cookie", userCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();
    });
    test('Should return a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions`', async () => {

        /* populate the db */

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];

        const to_insert_transactions = [
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
            },
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-1",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-2",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            },
            {
                username: "filippo-user-3",
                amount: 300,
                type: "investment",
                date: new Date("2023-06-03"),
            }
        ];
        const to_check_transactions = [
            {
                username: "filippo-admin",
                amount: 300,
                type: "investment-2",
                date: new Date("2023-06-03"),
                color: "red"
            },
            {
                username: "filippo-user",
                amount: 100,
                type: "investment",
                date: new Date("2023-06-01"),
                color: "black"
            },
            {
                username: "filippo-user",
                amount: 200,
                type: "investment",
                date: new Date("2023-06-02"),
                color: "black"
            },
        ];
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });
        const default_user_2 = await User.create({
            username: 'filippo-user-2',
            email: 'filippo-user-2@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });
        const default_user_3 = await User.create({
            username: 'filippo-user-3',
            email: 'filippo-user-3@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        await categories.insertMany(to_insert_categories);
        await transactions.insertMany(to_insert_transactions);
        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });
        await Group.create({
            name: "testing-group-2",
            members: [
                {
                    email: default_user_2.email,
                    user: default_user_2._id
                },
                {
                    email: default_user_3.email,
                    user: default_user_3._id
                },
            ]
        });

        const res = await request(app).get('/api/groups/testing-group-2/transactions/category/investment').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();


    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name`', async () => {

        /* populate the db */
        const admin_user = await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        const default_user_1 = await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken,
            role: 'User'
        });

        const to_insert_categories = [
            {
                type: "investment",
                color: "black",
            },
            {
                type: "investment-2",
                color: "red",
            },
        ];
        await categories.insertMany(to_insert_categories);

        await Group.create({
            name: "testing-group-1",
            members: [
                {
                    email: admin_user.email,
                    user: admin_user._id
                },
                {
                    email: default_user_1.email,
                    user: default_user_1._id
                },
            ]
        });

        const res = await request(app).get('/api/transactions/groups/testing-group-1/category/investment').set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined()

    });

})

describe("deleteTransaction", () => {

    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
    });

    test('Default behavior, admin case', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _id: tran_1._id,
        }

        const res = await request(app).delete('/api/users/filippo-user/transactions').send(body).set("Cookie", adminCookies);

        expect(res.status).toBe(200);
        expect(res.body.data.message).toBe("Transaction deleted");

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeNull();

    });
    test('Default behavior, user case', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _id: tran_1._id,
        }

        const res = await request(app).delete('/api/users/filippo-user/transactions').send(body).set("Cookie", userCookies);

        expect(res.status).toBe(200);
        expect(res.body.data.message).toBe("Transaction deleted");

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeNull();

    });
    test('Should return a 400 error if the `_id` in the request body does not represent a transaction in the database', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _id: "60be9c0a0c265000153d319a",
        }

        const res = await request(app).delete('/api/users/filippo-user/transactions').send(body).set("Cookie", adminCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeDefined();

    });
    test('Should return a 400 error if there are no _id in the body', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            // empty body
        }

        const res = await request(app).delete('/api/users/filippo-user/transactions').send(body).set("Cookie", adminCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeDefined();

    });
    test('Should return a 400 error if the username passed as a route parameter does not represent a user in the database', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _id: "tran_1._id",
        }

        const res = await request(app).delete('/api/users/filippo/transactions').send(body).set("Cookie", adminCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeDefined();

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            /* empty body */
        }

        const res = await request(app).delete('/api/users/filippo/transactions').send(body).set("Cookie", adminCookies);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeDefined();

    });
    test('Should return a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _id: tran_1._id,
        }

        const res = await request(app).delete('/api/users/filippo-admin/transactions').send(body).set("Cookie", userCookies);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findById(tran_1._id);
        expect(deleted).toBeDefined();

    });
})

describe("deleteTransactions", () => {
    /* clean up the opened connection to the db */
    beforeEach(async () => {
        await categories.deleteMany();
        await transactions.deleteMany();
        await User.deleteMany();
    });

    test('Default behavior', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _ids: [tran_1._id, tran_2._id]
        };

        const res = await request(app).delete('/api/transactions').set("Cookie", adminCookies).send(body);

        expect(res.status).toBe(200);
        expect(res.body.data.message).toBe("Transactions deleted");

        let deleted = await transactions.findOne({_id: tran_1._id});
        expect(deleted).toBeNull();
        deleted = await transactions.findOne({_id: tran_2._id});
        expect(deleted).toBeNull();

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            /* empty body */
        };

        const res = await request(app).delete('/api/transactions').set("Cookie", adminCookies).send(body);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findOne({_id: tran_1._id});
        expect(deleted).toBeDefined();
        deleted = await transactions.findOne({_id: tran_2._id});
        expect(deleted).toBeDefined();

    });
    test('Should return a 400 error if at least one of the ids in the array is an empty string', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _ids: [tran_1._id, ""]
        };

        const res = await request(app).delete('/api/transactions').set("Cookie", adminCookies).send(body);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findOne({_id: tran_1._id});
        expect(deleted).toBeDefined();
        deleted = await transactions.findOne({_id: tran_2._id});
        expect(deleted).toBeDefined();

    });
    test('Should return a 400 error if at least one of the ids in the array does not represent a transaction in the database', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _ids: [tran_1._id, "60be9c0a0c265000153d319a"]
        };

        const res = await request(app).delete('/api/transactions').set("Cookie", adminCookies).send(body);

        expect(res.status).toBe(400);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findOne({_id: tran_1._id});
        expect(deleted).toBeDefined();
        deleted = await transactions.findOne({_id: tran_2._id});
        expect(deleted).toBeDefined();

    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        /* populate the db */

        await categories.create({
            type: "investment",
            color: "black"
        });

        const tran_1 = await transactions.create({
            username: "filippo-user",
            amount: 100,
            type: "investment",
            date: new Date("2023-06-01"),
        });
        const tran_2 = await transactions.create({
            username: "filippo-admin",
            amount: 300,
            type: "investment-2",
            date: new Date("2023-06-03"),
        });

        await User.create({
            username: 'filippo-admin',
            email: 'filippo-admin@somedomain.com',
            password: 'password123',
            refreshToken: adminRefreshToken,
            role: 'Admin'
        });
        await User.create({
            username: 'filippo-user',
            email: 'filippo-user@somedomain.com',
            password: 'password123',
            refreshToken: userRefreshToken.replace("refreshToken=", ""),
            role: 'User'
        });

        const body =  {
            _ids: [tran_1._id, tran_2._id]
        };

        const res = await request(app).delete('/api/transactions').set("Cookie", userCookies).send(body);

        expect(res.status).toBe(401);
        expect(res.error).toBeDefined();

        let deleted = await transactions.findOne({_id: tran_1._id});
        expect(deleted).toBeDefined();
        deleted = await transactions.findOne({_id: tran_2._id});
        expect(deleted).toBeDefined();

    });

})
