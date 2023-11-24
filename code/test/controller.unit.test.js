import request from 'supertest';
import {app} from '../app';
import {categories, transactions} from '../models/model';
import { createCategory, deleteCategory, updateCategory, getCategories, createTransaction, getAllTransactions, getTransactionsByUser, getTransactionsByGroup, getTransactionsByGroupByCategory, deleteTransaction, deleteTransactions, getTransactionsByUserByCategory } from "../controllers/controller";
import {response} from "express";
import jwt from "jsonwebtoken";
import {handleAmountFilterParams, handleDateFilterParams, verifyAuth} from "../controllers/utils.js";

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User, Group } from '../models/User';
import { truncate } from 'fs';
import * as utils from "../controllers/utils.js";

beforeEach(() => {
    categories.find.mockClear();
    categories.findOne.mockClear();
    categories.countDocuments.mockClear();
    categories.prototype.save.mockClear();
    transactions.find.mockClear();
    transactions.findOne.mockClear();
    transactions.findById.mockClear();
    transactions.deleteOne.mockClear();
    transactions.aggregate.mockClear();
    transactions.prototype.save.mockClear();
    Group.find.mockClear();
    Group.findOne.mockClear();
    User.find.mockClear();
    User.findOne.mockClear();
});

// Mock the verifyAuth function
jest.mock("../models/model.js")
jest.mock("../models/User.js")
jest.mock("../controllers/utils.js", () => ({
    verifyAuth: jest.fn(),
    handleAmountFilterParams : jest.fn(),
    handleDateFilterParams : jest.fn()
}))

// done
describe("createCategory", (object, method) => {
    test('Should return a 200 response and an object category in json format', async () => {
        /* mock request */
        const req = {
            body: {
                type: "test_type",
                color: "test_color",
            },
        }
        /* mock response */
        /**
         *  ************************************************************************
         *  jest.fn() creates a new mock function.
         *  It can be used to replace a function or method in the code during testing
         *  and allows you to make assertions on its behavior, such as how many times
         *  it was called or with what arguments.
         *  By default, when you call the mock function, it returns undefined.
         *  ************************************************************************
         *  .mockReturnThis(): This is a method provided by Jest that modifies the behavior
         *  of the mock function.
         *  When chained after jest.fn(), it configures the mock function to return this when
         *  it is called. In the context of this code, this refers to the res object itself.
         *  ************************************************************************
         */
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }

        const returnedCategory = {type: "test_type", color: "test_color"} 
        /**
         * similar to the mockReturnThis, we force the verifyAuth defined as:
         *  jest.mock("../controllers/utils.js", () => ({
         *     verifyAuth: jest.fn()
         *  }))
         * to return a Value, specifically {flag: true, cause: "Authorized"}
         * this is going to replace the calls to verifyAuth in createCategory
         * with the desired value.
         *
         * If not done like this, the unit test will fail since he will not
         * elaborate the verifyAuth inside the tested function
         *
         * --!> ALL THE FUNCTION THAT THE TESTED FUNCTION CALLS HAVE TO BE MOCKED
         *      INSIDE UNIT TESTS.
         */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

        /* we call the function and await to execute (resolve) */
        await createCategory(req, res);

        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        /* controls on the default behaviour */
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data: returnedCategory, refreshedTokenMessage: res.locals.refreshedTokenMessage});

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        /* mock request without the type */
        const req = {
            body: {
                color: "test_color",
            },
        }

        /* mock response */
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

        /* we call the function and await to execute (resolve) */
        await createCategory(req, res);

        /* controls on expected behaviour */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Request body does not contain the necessary attributes"});

    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {

        /* mock request whit empty strings */
        const req = {
            body: {
                type: "",
                color: "",
            },
        }

        /* mock response */
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

        /* we call the function and await to execute (resolve) */
        await createCategory(req, res);

        /* controls on expected behaviour */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Parameters cannot be empty strings"});

    });
    test('Should return a 400 error if the type of category passed in the request body represents an already existing category in the database', async () => {

        /* mock request whit empty strings */
        const req = {
            body: {
                type: "test-type",
                color: "test-color",
            },
        };

        /* let's mock the categories.findOne() */
        // noinspection JSCheckFunctionSignatures
        let temp = jest.spyOn(categories, 'findOne');
        temp.mockResolvedValue(true);

        /* mock response */
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        /* we call the function and await to execute (resolve) */
        await createCategory(req, res);

        /* controls on expected behaviour */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The category already exists"});

    });
    test('Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        /* mock request whit empty strings */
        const req = {
            body: {
                type: "test-type",
                color: "test-color",
            },
        };

        /* mock response */
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        verifyAuth.mockReturnValue({flag: false, cause: "UnAuthorized"});


        /* we call the function and await to execute (resolve) */
        await createCategory(req, res);

        /* controls on expected behaviour */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "UnAuthorized"});

    });
})

// done
describe("updateCategory", () => {
    test('Default behavior, should return an object with parameter message that confirms successful editing and parameter count equal to count of transactions whose category was changed with the new type, plus a response code 200', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: "test_color_to_update",
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const updated_transactions = {
            matchedCount: 3,
        }

        const updateOne_result = {
            matchedCount: 1,
        };

        /* mock the find, used to search if the new category is already present */
        jest.spyOn(categories, 'find').mockResolvedValue({value: false, length: 0});

        /* mock the findOne, used to search if the category to update is present */
        jest.spyOn(categories, 'findOne').mockResolvedValue(true);

        /* mock the update one on the category */
        jest.spyOn(categories, 'updateOne').mockResolvedValue(updateOne_result);

        /* mock the updateMany related to the update of transaction */
        jest.spyOn(transactions, 'updateMany').mockResolvedValue(updated_transactions);

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        /* check results */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(categories.find).toHaveBeenCalledWith({type: "test_type_to_update"});
        /* expect the calls to update method, in this way we're sure those elements have been called */
        expect(categories.updateOne).toHaveBeenCalledWith(
            {type: "test_type"},
            {$set: {type: "test_type_to_update", color: "test_color_to_update"}}
        );
        expect(transactions.updateMany).toHaveBeenCalledWith(
            {type: "test_type"},
            {$set: {type: "test_type_to_update"}}
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toBeDefined();

    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                // empty
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Request body does not contain the necessary attributes",
        });

    });
    test('Should return a 400 error if the request body is not a string', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: 12
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);

    });
    test('Should return a 400 error if at least one of the parameters in the request body is an empty string', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: "",  // empty string
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Parameters cannot be empty strings",
        });

    });
    test('Should return a 400 error if the type of category passed as a route parameter does not represent a category in the database', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: "test_color_to_update",
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const updated_transactions = {
            matchedCount: 3,
        }


        const updateOne_result = {
            matchedCount: 1,
        };

        /* mock the find, used to search if the new category is already present */
        jest.spyOn(categories, 'find').mockResolvedValue({value: false, length: 0});

        /* mock the findOne, used to search if the category to update is present */
        jest.spyOn(categories, 'findOne').mockResolvedValue(false);

        /* mock the update one on the category */
        jest.spyOn(categories, 'updateOne').mockResolvedValue(updateOne_result);

        /* mock the updateMany related to the update of transaction */
        jest.spyOn(transactions, 'updateMany').mockResolvedValue(updated_transactions);

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        /* check results */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        /* expect the call to search if the root category is already present */
        expect(categories.findOne).toHaveBeenCalledWith(
            {type: "test_type"}
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "The category to update does not exists",
        });

    });
    test('Should return a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: "test_color_to_update",
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        /* mock the find, used to search if the new category is already present */
        jest.spyOn(categories, 'find').mockResolvedValue(true);

        /* mock auth */
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await updateCategory(req, res);

        /* check results */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        /* expect the call to search if the "to_update" category is already present */
        expect(categories.find).toHaveBeenCalledWith(
            {type: "test_type_to_update"}
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "The new category you specified in the request is already present in the db.",
        });

    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        /* prepare mock req and res */
        const req = {
            body: {
                type: "test_type_to_update",
                color: "test_color_to_update",
            },
            params: {
                type: "test_type",
                color: "test_color",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        /* mock auth */
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await updateCategory(req, res);

        /* check results */
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized",
        });

    });
})

//done
describe("deleteCategory", () => {
    test('Default case (N = T)', async () => {
        const req = {
            body: {
                types: ["to_delete_1", "to_delete_2"],
            }
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }];
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "countDocuments").mockImplementation(() => 2);
        jest.spyOn(categories, "find").mockImplementation(() => 2);
        jest.spyOn(categories, "findOne").mockImplementation(() => ({
            sort: jest.fn().mockReturnValue([{ _id: 1, type: "to_delete_2", color: "test_color" }])
        }));
        jest.spyOn(transactions, "updateMany").mockImplementation(() => 2);
        await deleteCategory(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200);

    });
    test('Default case (N > T)', async () => {
        const req = {
            body: {
                types: ["to_delete_1", "to_delete_2"],
            }
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }];
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "countDocuments").mockImplementation(() => 4);
        jest.spyOn(categories, "find").mockImplementation(() => 2);
        jest.spyOn(categories, "findOne").mockImplementation(() => ({
            sort: jest.fn().mockReturnValue({ _id: 1, type: "to_delete_2", color: "test_color" })
        }));
        jest.spyOn(transactions, "updateMany").mockImplementation(() => 2);
        await deleteCategory(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200);

    });
    test('Default case only one category', async () => {
        const req = {
            body: {
                types: "test_type",
            }
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }];
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "countDocuments").mockImplementation(() => 4);
        jest.spyOn(categories, "find").mockImplementation(() => 2);
        jest.spyOn(categories, "findOne").mockImplementation(() => ({
            sort: jest.fn().mockReturnValue([{ _id: 1, type: "to_delete_2", color: "test_color" }])
        }));
        jest.spyOn(transactions, "updateMany").mockImplementation(() => 2);
        await deleteCategory(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200);

    });
    test("Categories cannot be empty strings", async () => {
        const req = {
            body: {
                types: ["to_delete_1", ""],
            }
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }];
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "countDocuments").mockImplementation(() => 4);
        jest.spyOn(categories, "find").mockImplementation(() => 2);
        jest.spyOn(categories, "findOne").mockImplementation(() => ({
            sort: jest.fn().mockReturnValue([{ _id: 1, type: "to_delete_2", color: "test_color" }])
        }));
        jest.spyOn(transactions, "updateMany").mockImplementation(() => 2);
        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {

        // prepare mock req and res
        const req = {
            body: {
                type: [
                    "category_to_delete",
                    "some",
                ],
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // mock auth
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});

        await deleteCategory(req, res);

        // check results

        // expect the calls to update method, in this way we're sure those elements have been called
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized",
        });
    });
    test('Should return a 400 error if the request body does not contain all the necessary attributes', async () => {

        // prepare mock req and res 
        const req = {
            body: {
                // empty body
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // mock auth 
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await deleteCategory(req, res);

        // check results 

        // expect the calls to update method, in this way we're sure those elements have been called 
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Request body don't contain anything",
        });
    });
    test('Should return a 400 error if called when there is only one category in the database', async () => {

        // prepare mock req and res 
        const req = {
            body: {
                types: "category_to_delete",
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // mock auth 
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(categories, "countDocuments").mockReturnValueOnce(1);


        await deleteCategory(req, res);

        // check results 

        // expect the calls to update method, in this way we're sure those elements have been called 
        expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "Admin"});
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "You cannot call this method if there is only one category in the db",
        });
    });
    test('Should return a 400 error if at least one of the types in the array is an empty string', async () => {

        // prepare mock req and res 
        const req = {
            body: {
                types: ""
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        const to_delete = {
            type: "category_to_delete",
            color: "test_color",
        };

        const oldest = {
            type: "oldest_category",
            color: "test-color",
        };

        // mock auth
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        // mock count documents
        jest.spyOn(categories, 'countDocuments').mockResolvedValue(3);
        jest.spyOn(categories, 'findOne').mockReturnValueOnce( {
            sort : jest.fn().mockReturnValueOnce({type : "some"})
        });

        await deleteCategory(req, res);


        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Request body types cannot be empty",
        });
    });
    test("The category does not exist", async () => {

        const req = {
            body: {
                types: ["to_delete_1", "some"],
            }
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }];
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "countDocuments").mockImplementation(() => 2);
        jest.spyOn(categories, "find").mockImplementation(() => 2);
        jest.spyOn(categories, 'findOne').mockImplementation((query) => {
            if (!query || Object.keys(query).length === 0) {
                return {
                    sort: jest.fn().mockResolvedValue({ _id: 1, type: "to_delete_1", color: "test_color" })
                };
            } else {
                return Promise.resolve(false);
            }
        });

        jest.spyOn(transactions, "updateMany").mockImplementation(() => 2);
        await deleteCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
    test("Categories deleted successfully", async () => {

        // prepare mock req and res
        const req = {
            body: {
                types: ["tonno"]
            },
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals : {
                refreshedTokenMessage : "abc"
            }
        };

        // mock auth
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        // mock count documents
        jest.spyOn(categories, 'countDocuments').mockResolvedValue(3);
        jest.spyOn(categories, 'findOne').mockReturnValueOnce( {
            sort : jest.fn().mockReturnValueOnce({type : "some"})
        });
        jest.spyOn(categories, "findOne").mockReturnValueOnce(true);
        jest.spyOn(categories, "deleteOne").mockReturnValueOnce( true);
        jest.spyOn(transactions, "updateMany").mockReturnValueOnce( {matchedCount : 1});


        await deleteCategory(req, res);


        //expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                message: "Categories deleted successfully",
                count: 1,
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    });
});


//done
describe("getCategories", () => {
    test('Should return a 200 response and an object category in json format', async () => {
        const req = {
        }
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const returnedCategories = [{ type: "food", color: "red" }]
        verifyAuth.mockReturnValue({flag: true, cause: "Simple"});
        jest.spyOn(categories, "find").mockImplementation(() => returnedCategories)
        await getCategories(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(categories.find).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data: returnedCategories, refreshedTokenMessage: res.locals.refreshedTokenMessage})
    });
    test('Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)', async () => {
        const req = {
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await getCategories(req, res);
        expect(verifyAuth).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "Unauthorized",
        });
    });
});



describe("createTransaction", () => {

    test('The username passed as a route param does not exists', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "test_amount",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => null)

        await createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The username passed as a route param does not exists"})
    });
    test('One of the body parameters is undefined', async () => {
        const req = {
            body: {
                username: "test_username",
                // undefined
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)
        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "One of the body parameters is undefined"})
    });
    test('One of the body parameters is an empty string', async () => {
        const req = {
            body: {
                username: "",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)
        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "One of the body parameters is an empty string"})
    });
    test('The category passed in the request body does not exists', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)
        jest.spyOn(categories, "findOne").mockImplementation(() => false)
        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The category passed in the request body does not exists"})
    });
    test('The username passed in the request body does not exists', async () => {
        const req = {
            body: {
                username: "test_username_body",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username_param",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValueOnce(true)
        jest.spyOn(categories, "findOne").mockImplementationOnce(() => true)
        jest.spyOn(User, "findOne").mockImplementationOnce(() => false)

        await createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The username passed in the request body does not exists"})
    });
    test('The user passed in the request body is not the same as the one passed as a parameter', async () => {
        const req = {
            body: {
                username: "test_username_body",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username_param",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValue({username: "test_username_param"})
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        jest.spyOn(User, "findOne").mockReturnValue({username: "test_username_body"})
        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The user passed in the request body is not the same as the one passed as a parameter"})
    });
    test('Unauthorized', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValue({username: "test_username"})
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        jest.spyOn(User, "findOne").mockReturnValue({username: "test_username"})
        verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"});
        verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"});

        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    });
    test('Not the same user as the one specified in the route', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
            cookies: {
                refreshToken: ""
            }
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        jest.spyOn(categories, "findOne").mockImplementationOnce(() => true)
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        verifyAuth.mockReturnValueOnce({flag: false, cause: "Unauthorized"});
        verifyAuth.mockReturnValueOnce({flag: true, cause: "Authorized"});

        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username2"})

        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Not the same user as the one specified in the route"})
    });
    test('Amount not parsable', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "abc",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
            cookies: {
                refreshToken: ""
            }
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        jest.spyOn(categories, "findOne").mockImplementationOnce(() => true)
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        //parseFloat.mockReturnValue(NaN);
        await createTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Amount not parsable"})
    });
    test('Correct behaviour', async () => {
        const req = {
            body: {
                username: "test_username",
                amount: "100",
                type: "test_type",

            },
            params: {
                username: "test_username",
            },
            cookies: {
                refreshToken: ""
            }
        };
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        const new_transactions = {
            username : "test_username",
            amount : "100",
            type : "test_type",
            date : undefined,
        };
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        jest.spyOn(categories, "findOne").mockImplementationOnce(() => true)
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "test_username"})
        
        //parseFloat.mockReturnValue(amount);

        await createTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
    
});

//done
describe("getAllTransactions", () => {
    test('Unauthorized', async () => {
        const req = {
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await getAllTransactions(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized",
        });
    });
    test("Correct behaviour", async () => {
        const req = {
            body: {    
            },
            params: {
            },
            cookies : {
               refreshToken : "a23s4d5f67g8h"
            },
        
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }

        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(transactions, "find").mockReturnValueOnce([{username : "primo", amount : 123, type : "User", date : "3000"}])
        jest.spyOn(categories, "findOne").mockReturnValueOnce({color : undefined})

        await getAllTransactions(req, res);


        const expected = {
            data : [{
                username : "primo",
                amount : 123,
                type : "User",
                date : "3000",
                color : undefined
            }],
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        }

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected)
    
    });
});

//done
describe("getTransactionsByUser", () => {

    test('Username does not exist', async () => {
        const req = {
            params: {
                username: "nonexistentuser"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        User.findOne.mockResolvedValueOnce(null);

        await getTransactionsByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "The username don't exists" });
    });
    test("Unauthorized", async () => {
        const req = {
            body: {
                
            },
            params: {
                username: 'test_username',
            },
            cookies : {
               refreshToken : ''
            },
            originalUrl: '/transactions/users'
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }

        jest.spyOn(User, "findOne").mockImplementation(() => true)
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await getTransactionsByUser(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    
    });
    test("Unauthorized (v2)", async () => {
        const req = {
            body: {    
            },
            params: {
                username: 'test_username',
            },
            cookies : {
               refreshToken : "a23s4d5f67g8h"
            },
            originalUrl: ""
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }

        jest.spyOn(User, "findOne").mockReturnValueOnce(true)
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await getTransactionsByUser(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    
    });
    test('Normal user route, with filters', async () => {
        const req = {
            params: {
                username: "normaluser"
            },
            originalUrl: "/transactions"
        };
        req.query = {
            maxAmount: "100",
            minAmount: "50"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
        User.findOne.mockResolvedValueOnce({ username: "normaluser" });
        transactions.find.mockResolvedValueOnce([{ username: "normaluser", amount: 75, type: "Type1", date: "2022-01-01" }]);
        categories.findOne.mockResolvedValueOnce({ color: "blue" });

        await getTransactionsByUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "normaluser" });
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "normaluser" });
        expect(transactions.find).toHaveBeenCalledWith({
            username: "normaluser",
            //amount: {
            //    $gt: 50,
            //    $lt: 100
            //    
            //}
        });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "Type1" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [{
                username: "normaluser",
                amount: 75,
                type: "Type1",
                date: "2022-01-01",
                color: "blue"
            }],
            refreshedTokenMessage: "abc"
        });
    });
    test('Normal user route, with filters (V2)', async () => {
        const req = {
            params: {
                username: "normaluser"
            },
            originalUrl: "/transactions"
        };
        req.query = {
            maxAmount: "100",
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
        User.findOne.mockResolvedValueOnce({ username: "normaluser" });
        transactions.find.mockResolvedValueOnce([{ username: "normaluser", amount: 75, type: "Type1", date: "2022-01-01" }]);
        categories.findOne.mockResolvedValueOnce({ color: "blue" });

        await getTransactionsByUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "normaluser" });
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "normaluser" });
        expect(transactions.find).toHaveBeenCalledWith({
            username: "normaluser",
            //amount: {
            //    $lt: 100,
            //}
        });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "Type1" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [{
                username: "normaluser",
                amount: 75,
                type: "Type1",
                date: "2022-01-01",
                color: "blue"
            }],
            refreshedTokenMessage: "abc"
        });
    });
    test('Normal user route, with filters (V3)', async () => {
        const req = {
            params: {
                username: "normaluser"
            },
            originalUrl: "/transactions"
        };
        req.query = {
            minAmount: "50"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
        User.findOne.mockResolvedValueOnce({ username: "normaluser" });
        transactions.find.mockResolvedValueOnce([{ username: "normaluser", amount: 75, type: "Type1", date: "2022-01-01" }]);
        categories.findOne.mockResolvedValueOnce({ color: "blue" });

        await getTransactionsByUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "normaluser" });
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "normaluser" });
        expect(transactions.find).toHaveBeenCalledWith({
            username: "normaluser",
            //amount: {
            //    $gt: 50
            //}
        });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "Type1" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [{
                username: "normaluser",
                amount: 75,
                type: "Type1",
                date: "2022-01-01",
                color: "blue"
            }],
            refreshedTokenMessage: "abc"
        });
    });
    test('Admin route, without filters', async () => {
        const req = {
            params: {
                username: "normaluser"
            },
            originalUrl: "/transactions/users"
        };
        req.query = {
            maxAmount: "100",
            minAmount: "50"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        User.findOne.mockResolvedValueOnce({ username: "normaluser" });

        verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });

        transactions.find.mockResolvedValueOnce([{ username: "normaluser", amount: 75, type: "Type1", date: "2022-01-01" }]);
        categories.findOne.mockResolvedValueOnce({ color: "blue" });

        await getTransactionsByUser(req, res);


        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [{
                username: "normaluser",
                amount: 75,
                type: "Type1",
                date: "2022-01-01",
                color: "blue"
            }],
            refreshedTokenMessage: "abc"
        });
    });


});

describe("getTransactionsByUserByCategory", () => {
    test('Category does not exist', async () => {
        const req = {
            params: {
                username: "existinguser",
                category: "nonexistentcategory"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        User.findOne.mockResolvedValueOnce({ username: "existinguser" });
        categories.findOne.mockResolvedValueOnce(null);

        await getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "existinguser" });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "nonexistentcategory" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "The category don't exists" });
    });
    test("The username doesn't exist", async () => {
        const req = {
            params: {
                username: "existinguser",
                category: "nonexistentcategory"
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        User.findOne.mockResolvedValueOnce(false);

        await getTransactionsByUserByCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "The username doesn't exist" });
    });
    test('Admin route, unauthorized', async () => {
        const req = {
            params: {
                username: "adminuser",
                category: "category1"
            },
            originalUrl: "/transactions/users"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const mockUser = { username: "adminuser" }; // Crea un mock dell'utente
        const mockCategory = { type: "category1" }; // Crea un mock della categoria
        User.findOne.mockResolvedValueOnce(mockUser); // Imposta la mock di User.findOne per restituire l'utente
        categories.findOne.mockResolvedValueOnce(mockCategory); // Imposta la mock di categories.findOne per restituire la categoria
        verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });

        await getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "adminuser" });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "category1" });
        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
    test('Normal user route, unauthorized', async () => {
        const req = {
            params: {
                username: "normaluser",
                category: "category1"
            },
            originalUrl: "/transactions"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const mockUser = { username: "normaluser" }; // Crea un mock dell'utente
        const mockCategory = { type: "category1" }; // Crea un mock della categoria
        User.findOne.mockResolvedValueOnce(mockUser); // Imposta la mock di User.findOne per restituire l'utente
        categories.findOne.mockResolvedValueOnce(mockCategory); // Imposta la mock di categories.findOne per restituire la categoria
        verifyAuth.mockReturnValueOnce({ flag: false, cause: "Unauthorized" });
        await getTransactionsByUserByCategory(req, res);

        expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "User", username: "normaluser" });
        expect(User.findOne).toHaveBeenCalledWith({ username: "normaluser" });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
    test('Normal user route, with valid category', async () => {
        const req = {
            params: {
                username: "normaluser",
                category: "category1"
            },
            originalUrl: "/transactions"
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        };
        verifyAuth.mockReturnValueOnce({ flag: true, cause: "Authorized" });
        User.findOne.mockResolvedValueOnce({ username: "normaluser" });
        categories.findOne.mockResolvedValue({ type: "category1", color: "blue" });
        transactions.find.mockResolvedValueOnce([
            { username: "normaluser", amount: 100, type: "category1", date: "2022-01-01" },
            { username: "normaluser", amount: 150, type: "category1", date: "2022-01-02" }
        ]);

        await getTransactionsByUserByCategory(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ username: "normaluser" });
        expect(categories.findOne).toHaveBeenCalledWith({ type: "category1" });
        expect(transactions.find).toHaveBeenCalledWith({ username: "normaluser", type: "category1" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: [
                { username: "normaluser", amount: 100, type: "category1", date: "2022-01-01", color: "blue" },
                { username: "normaluser", amount: 150, type: "category1", date: "2022-01-02", color: "blue" }
            ],
            refreshedTokenMessage: "abc"
        });
    });
});

describe("getTransactionsByGroup", () => {

    test('Returns a 401 error if called by an authenticated user who is not an admin', async () => {
        const req = {
            body: {
            },
            params: {
                name: "test_groupname",
            },
            originalUrl: "../transactions/group"
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        jest.spyOn(Group, "findOne").mockImplementation(() => true)

        await getTransactionsByGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    });

    test('Returns a 400 error if the name passed as a route parameter does not represent a group in the database', async () => {
        const req = {
            body: {
            },
            params: {
                name: "/api/users/Mario/transactions",
            },
            originalUrl: "../transactions/users"
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockImplementation(() => false)

        await getTransactionsByGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The group does not exists"})
    });

    test("The user is not part of the specified group", async () => {
        const req = {
            body: {
            },
            params: {
                name: "test_groupname",
            },
            originalUrl: "",
            cookies : {
                refreshToken : ""
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(Group, "findOne").mockReturnValueOnce({members : [{email: "primo@gmail.com"}, {email: "secondo@gmail.com"}]})
        //verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(User, "findOne").mockReturnValueOnce({email: "terzo@gmail.com"})


        await getTransactionsByGroup(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "The user is not part of the specified group"})
    });
    test("Correct Behaviour", async () => {
        const req = {
            body: {
            },
            params: {
                name: "test_groupname",
            },
            originalUrl: "",
            cookies : {
                refreshToken : ""
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(Group, "findOne").mockReturnValueOnce({members : [{email: "primo@gmail.com", user: "primo"}]})
        //verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(User, "findOne").mockReturnValueOnce({email: "primo@gmail.com", user : "primo"})

        jest.spyOn(User, "findOne").mockReturnValueOnce({username : "primo"})
        jest.spyOn(transactions, "find").mockReturnValueOnce([{username : "primo", amount : 123, type : "User", date : "3000"}])

        jest.spyOn(categories, "findOne").mockReturnValueOnce({color : undefined})


        await getTransactionsByGroup(req, res);

        const expected = {
            data : [{
                username : "primo",
                amount : 123,
                type : "User",
                date : "3000",
                color : undefined
            }],
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        }

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected)
    });
})

describe("getTransactionsByGroupByCategory", () => {
    test('The group does not exists', async () => {
        const req = {
            body: {
            },
            params: {
                name: 'test_groupname',
                category: 'test_category'

            },
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockImplementation(() => false)

        await getTransactionsByGroupByCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The group does not exists"})
    });
    test('The category does not exists', async () => {
        const req = {
            body: {
            },
            params: {
                name: 'test_groupname',
                category: 'test_category'

            },
            originalUrl: "/transactions/group",
            cookies : {
                refreshToken : "435678ygb765v4c5e"
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockImplementation(() => true)
        jest.spyOn(categories, "findOne").mockImplementation(() => false)

        await getTransactionsByGroupByCategory(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The category does not exists"})
    });
    test('Unauthorized', async () => {
        const req = {
            body: {
            },
            params: {
                name: 'test_groupname',
                category: 'test_category'

            },
            originalUrl: "/transactions/groupTonno",
            cookies : {
                refreshToken : "435678ygb765v4c5e"
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockImplementation(() => true)
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await getTransactionsByGroupByCategory(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    });
    test('The user is not part of the specified group', async () => {
        const req = {
            body: {
            },
            params: {
                name: 'test_groupname',
                category: 'test_category'

            },
            originalUrl: "/transactions/Tonno",
            cookies : {
                refreshToken : "435678ygb765v4c5e"
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockReturnValueOnce({members :[{email: "Marte@gmail.com"}]})
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        jest.spyOn(User, "findOne").mockReturnValueOnce({email: "tonno@gmail.com"})


        await getTransactionsByGroupByCategory(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "The user is not part of the specified group"})
    });
    test('The user is not part of the specified group', async () => {
        const req = {
            body: {
            },
            params: {
                name: 'test_groupname',
                category: 'test_category'

            },
            originalUrl: "/transactions/Tonno",
            cookies : {
                refreshToken : "435678ygb765v4c5e"
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        jest.spyOn(Group, "findOne").mockReturnValueOnce({members :[{email: "tonno@gmail.com"}]})
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        jest.spyOn(User, "findOne").mockReturnValueOnce({email: "tonno@gmail.com"})

        jest.spyOn(User, "findOne").mockReturnValueOnce({email: "tonno@gmail.com"})
        jest.spyOn(transactions, "find").mockReturnValueOnce([{username : "tonno", amount : 100, type : "User", date : "data"}])
        jest.spyOn(categories, "findOne").mockReturnValueOnce({color : "red"})



        await getTransactionsByGroupByCategory(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });


    test("Correct behaviour", async () => {
        const req = {
            body: {
            },
            params: {
                name: "test_groupname",
                category: 'test_category'
            },
            originalUrl: "/transactions/group",
            cookies : {
                refreshToken : "d45f65g728hjs9"
            }
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(Group, "findOne").mockReturnValueOnce({name: "test_groupname", members: [{username: "primo", email: "primo@gmail.com"}]})
        jest.spyOn(categories, "findOne").mockImplementation(() => true)
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(User, "findOne").mockReturnValueOnce({username: "primo", email: "primo@gmail.com"})
        jest.spyOn(transactions, "find").mockReturnValueOnce([{username : "primo", amount : 123, type : "User", date : "3000"}])
        jest.spyOn(categories, "findOne").mockReturnValueOnce({color : undefined})
        await getTransactionsByGroupByCategory(req, res);
        const expected = {
            data : [{
                username : "primo",
                amount : 123,
                type : "User",
                date : "3000",
                color : undefined
            }],
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        }

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expected)
    });
})

//done
describe("deleteTransaction", () => {

    test('Returns a 400 error if the username passed as a route parameter does not represent a user in the database', async () => {
        const req = {
            body: { _id: "test_id",
            },
            params: {
                username: "test_username",
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => null)
        await deleteTransaction(req, res);
        expect(User.findOne).toHaveBeenCalled()
        //expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The username don't exists"})
    });

    test('Returns a 400 error if the id in the request body does not contain all the necessary attributes', async () => {
        const req = {
            body: { _id: "",
            },
            params: {
                username: "test_username",
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)

        await deleteTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The body is empty"})
    });

    test('Id is not specified', async () => {
        const req = {
            body: { _id: "1223",
            },
            params: {
                username: "test_username",
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)
        jest.spyOn(transactions, "findOne").mockImplementation(() => false)
        await deleteTransaction(req, res);

        //expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Id is not specified"})
    });

    test('User not authenticated', async () => {
        const req = {
            body: { _id: "1223",
            },
            params: {
                username: "test_username",
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockImplementation(() => true)
        jest.spyOn(transactions, "findOne").mockImplementation(() => true)
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await deleteTransaction(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "User not authenticated"})
    });

    test('Transaction deleted', async () => {
        const req = {
            body: { _id: "1223",
            },
            params: {
                username: "test_username",
            },
            cookies : {
                refreshToken : "1257"
            }
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        jest.spyOn(User, "findOne").mockReturnValueOnce({username : "test_username"})
        jest.spyOn(transactions, "findOne").mockImplementation(() => true)
        jest.spyOn(User, "findOne").mockImplementationOnce(() => true)
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(transactions, "deleteOne").mockImplementationOnce(() => true)
        await deleteTransaction(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})
    });
})


describe("deleteTransactions", () => {

    test('Please specify a list of ids in form of an array.', async () => {
        const req = {
            body: {
            },
        };

        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: false, cause: "Unauthorized"});
        await deleteTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
    });


    test('Please specify a list of ids in form of an array.', async () => {
        const req = {
            body: {
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        await deleteTransactions(req, res);
        expect(verifyAuth).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Please specify a list of ids in form of an array."})
    });

    test('Ids cannot be empty strings', async () => {
        const req = {
            body: {
                _ids: [""]
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});

        await deleteTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Ids cannot be empty strings"})
    });

    test('Ids needs to be present in the db', async () => {
        const req = {
            body: {
                _ids: ['a7863vayva67r527']
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(transactions, "findOne").mockImplementationOnce(() => false)

        await deleteTransactions(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "Ids needs to be present in the db"})
    });

    test('Transactions deleted', async () => {
        const req = {
            body: {
                _ids: ['715e2td8g738']
            },
        };
        
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshedTokenMessage: "abc"
            }
        }
        verifyAuth.mockReturnValue({flag: true, cause: "Authorized"});
        jest.spyOn(transactions, "findOne").mockImplementation(() => true)
        jest.spyOn(transactions, "deleteOne").mockImplementation(() => true)

        await deleteTransactions(req, res);

        //expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data: {message: "Transactions deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})
    });  
})


