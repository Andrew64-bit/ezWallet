// noinspection JSUnresolvedReference

import {json} from "express";
import {categories, transactions} from "../models/model.js";
import {Group, User, UserSchema} from "../models/User.js";
import {
    handleDateFilterParams,
    handleAmountFilterParams,
    verifyAuth,
} from "./utils.js";
import mongoose from 'mongoose';
import {locals} from "express/lib/application.js";
import {re} from "@babel/core/lib/vendor/import-meta-resolve.js";

/**
 * Create a new category
 - Request Body Content: An object having attributes `type`, `color`
 - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = async (req, res) => {
    try {

        /* only admin can call this function */
        let validation = verifyAuth(req, res, {authType: "Admin"})
        if (validation.flag === false) {
            return res.status(401).json({error: validation.cause})
        }

        const {type, color} = req.body;

        /* check if the parameters are presents */
        if (type === undefined || color === undefined) {
            throw new Error("Request body does not contain the necessary attributes");
        }

        /* check if the parameters are not empty strings*/
        if (type === "" || color === "") {
            return res.status(400).json({
                error: "Parameters cannot be empty strings",
            });
        }

        const new_category_json = new categories({
            type,
            color,
        });

        /* check if new category already exists */
        let to_insert = await categories.findOne({
            type: type,
        });
        if (to_insert) {
            return res.status(400).json({
                error: "The category already exists",
            }); // unauthorized
        }

        const new_category = await categories.create(new_category_json);

        /* if we are here no problems */
        return res.status(200).json({
            data: {
                type: type, color: color
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    } catch (error) {
        return res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Edit a category's type or color
 - Request Body Content:   An object having attributes `type` and `color` equal to
 the new values to assign to the category.
 - Response `data` Content: An object with parameter `message` that confirms successful
 editing and a parameter `count` that is equal to the count of transactions whose
 category was changed with the new type.
 - Optional behavior:
 - error 401 returned if the specified category does not exist.
 - error 401 is returned if new parameters have invalid values.
 */
export const updateCategory = async (req, res) => {
    try {

        /* only admin can call this function */
        let validation = verifyAuth(req, res, {authType: "Admin"})
        if (validation.flag === false) {
            return res.status(401).json({error: validation.cause})
        }

        const {type, color} = req.body;
        let old_type = req.params.type;

        /* check if the parameters are presents */
        if (type === undefined || color === undefined) {
            throw new Error("Request body does not contain the necessary attributes");
        }

        if (type === "" || color === "") {
            return res.status(400).json({
                error: "Parameters cannot be empty strings",
            }); // wrong format
        }

        let new_type = type;

        /* checks the params */
        if (typeof new_type != "string" || typeof color != "string") {
            return res.status(400).json({
                error: "Wrong category format",
            }); // wrong format
        }

        /* check if new type is not already present */
        let new_type_obj = await categories.find({type: new_type});
        if (new_type_obj.length !== 0) {
            return res.status(400).json({
                error: "The new category you specified in the request is already present in the db.",
            }); // new category you specified is already present
        }

        /* try to search for the category */
        let category_to_update = await categories.findOne({type: old_type});

        /* if the category do not exist */
        if (!category_to_update) {
            return res.status(400).json({
                error: "The category to update does not exists",
            }); // no category
        }

        /* update and manage error */
        let result_cat = await categories.updateOne(
            {type: old_type},
            {$set: {type: new_type, color: color}}
        );

        let result_tran = await transactions.updateMany(
            {type: old_type},
            {$set: {type: new_type}}
        );

        /* returning message and count */
        return res.status(200).json({
            data: {
                message: "Category edited successfully",
                count: result_tran.matchedCount
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Delete a category
 - Request Body Content: An array of strings that lists the `types` of the categories to be deleted.
 - Response `data` Content:    An object with parameter `message` that confirms successful deletion and a parameter
 `count` that is equal to the count of affected transactions (deleting a category sets
 all transactions with that category to have `investment` as their new category)
 - Optional behavior:
 - error 401 is returned if the specified category does not exist
 */
export const deleteCategory = async (req, res) => {
    try {

        /* only admin can call this function */
        let validation = verifyAuth(req, res, {authType: "Admin"})
        if (validation.flag === false) {
            return res.status(401).json({error: validation.cause})
        }

        let count = 0;
        let {types} = req.body;

        /* check no params */
        if (types === undefined) {
            throw new Error("Request body don't contain anything");
        }

        /* check empty array */
        if (types.length === 0) {
            throw new Error("Request body types cannot be empty");
        }

        const number_of_categories = await categories.countDocuments({});
        if (number_of_categories === 1) {
            return res.status(400).json({
                error: "You cannot call this method if there is only one category in the db",
            });
        }

        /* get the oldest category */
        let oldestCategory = await categories.findOne().sort({_id: 1});

        /* manage the case N = T*/
        // noinspection JSUnresolvedReference
        if (types.length === number_of_categories) {

            /* we need to remove the oldest category in the array */
            types = types.filter(type => type !== oldestCategory.type);

        } else if (Array.isArray(types)) {
            /* check if the old category is present in the list of the categories to delete */
            if (types.includes(oldestCategory.type)) {
                /* get the oldest category that is not in the T */
                oldestCategory = await categories.findOne({ type: { $nin: types }}).sort({_id: 1});
            }
        }

        let transaction_number = 0;
        /* for every category in the array do the update */
        if (!Array.isArray(types)){
            /* check empty string */
            if (types === "") {
                return res.status(400).json({
                    error: "Categories cannot be empty strings",
                });
            }

            let category = await categories.findOne({type: types});
            if (!category) {
                return res.status(400).json({
                    error: "The category does not exist",
                });
            }

            /** check correctness */
            await categories.deleteOne({type: types});

            /** updates transactions and manage error */
            let updated_transactions = await transactions.updateMany(
                {type: types},
                {$set: {type: oldestCategory.type}}
            );
            transaction_number += updated_transactions.matchedCount;
        } else {
            for (const categoryType of types) {

                /* check empty string */
                if (categoryType === "") {
                    return res.status(400).json({
                        error: "Categories cannot be empty strings",
                    });
                }

                /** check if category exists */
                let category = await categories.findOne({type: categoryType});
                if (!category) {
                    return res.status(400).json({
                        error: "The category does not exist",
                    });
                }

                await categories.deleteOne({type: categoryType});

                /** updates transactions and manage error */
                let updated_transactions = await transactions.updateMany(
                    {type: categoryType},
                    {$set: {type: oldestCategory.type}}
                );

                /** update counter */
                transaction_number += updated_transactions.matchedCount;
            }

        }

        /** success */
        return res
            .status(200)
            .json({
                data: {
                    message: "Categories deleted successfully",
                    count: transaction_number,
                },
                refreshedTokenMessage: res.locals.refreshedTokenMessage,
            });
    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Return all the categories
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `type` and `color`
 - Optional behavior:
 - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
    try {

        /* the user needs to be authenticated */
        let validation = verifyAuth(req, res, {authType: "Simple"})
        if (validation.flag === false) {
            throw new Error(validation.cause);
        }

        let data = await categories.find({});

        let filter = data.map((v) =>
            Object.assign(
                {},
                {
                    type: v.type,
                    color: v.color,
                }
            )
        );

        return res.status(200).json({
            data: filter,
            refreshedTokenMessage: res.locals.refreshedTokenMessage,
        });
    } catch (error) {
        res.status(401).json({
            error: error.message,
        });
    }
};

/**
 * Create a new transaction made by a specific user
 - Request Body Content: An object having attributes `username`, `type` and `amount`
 - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
 - Optional behavior:
 - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
    try {

        let username_param = req.params.username;

        /* check if the user passed as route parameter exists */
        const user_param_exists = await User.findOne({username: username_param});
        if (!user_param_exists) {
            return res.status(400).json({
                error: "The username passed as a route param does not exists",
            });
        }

        /* retrieve data */
        const {username, amount, type} = req.body;

        /* check if one of the parameters is undefined */
        if (username === undefined || amount === undefined || type === undefined) {
            throw new Error("One of the body parameters is undefined");
        }
        /* check if one of the parameters is an empty string */
        if (username === "" || amount === "" || type === "") {
            return res.status(400).json({
                error: "One of the body parameters is an empty string",
            });
        }

        /* check if the category exists */
        const category_exists = await categories.findOne({type: type});
        if (!category_exists) {
            return res.status(400).json({
                error: "The category passed in the request body does not exists",
            });
        }

        /* check if the username passed in the body exists in the db */
        const user_exist = await User.findOne({username: username});
        if (!user_exist) {
            return res.status(400).json({
                error: "The username passed in the request body does not exists",
            });
        }

        /* check if the user is the same as the one in the params */
        if (username !== username_param) {
            return res.status(400).json({
                error: "The user passed in the request body is not the same as the one passed as a parameter",
            });
        }

        /* check if the user is authenticated */
        /* before check if the user is an admin */
        let validation = verifyAuth(req, res, {authType: "Admin"});
        if (validation.flag === false) {
            validation = verifyAuth(req, req, {
                authType: "User",
                username: username,
            })

            /* let's check if is a user */
            if (validation.flag === false) {
                /* user not authenticated */
                return res.status(401).json({error: validation.cause})
            }
        }

        /* the user is authenticated, but we need to check if the user authenticated is the same as the one in the route */
        const db_user = await User.findOne({refreshToken: req.cookies.refreshToken});
        if (db_user === null || (db_user.username !== username)) {
            return res.status(401).json({
                error: "Not the same user as the one specified in the route",
            }); // Invalid username
        }

        /* check if the number is parsable to floating point */
        const floatValue = parseFloat(amount);
        if (isNaN(floatValue)) {
            return res.status(400).json({
                error: "Amount not parsable",
            });
        }

        /* if here all ok, let's add a transaction */

        let date = new Date();
        const new_transactions = {
            username : username,
            amount : floatValue,
            type : type,
            date : date,
        };

        await transactions.create(
            new_transactions
        );

        return res.status(200).json({
            data: new_transactions,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });


    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Return all transactions made by all users
 - Request Body Content:
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {

        /* only admin can call this function */
        let validation = verifyAuth(req, res, {authType: "Admin"})
        if (validation.flag === false) {
            throw new Error(validation.cause);
        }

        const retrieved = await transactions.find({});
        let to_be_returned = [];

        for (const element of retrieved) {

            let cat = await categories.findOne({type: element.type});

            let transaction = {
                username: element.username,
                amount: element.amount,
                type: element.type,
                date: element.date,
                color: cat.color
            };
            to_be_returned.push(transaction);
        }

        return res.status(200).json({
            data: to_be_returned,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(401).json({
            error: error.message,
        });
    }
};

/**
 * Return all transactions made by a specific user
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - error 401 is returned if the user does not exist
 - empty array is returned if there are no transactions made by the user
 - if there are query parameters and the function has been called by a Regular user then the
 returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
    try {

        const username = req.params.username;

        /* check if the username exists */
        let is_present = await User.findOne({username: username});
        if (!is_present) {
            throw new Error("The username don't exists");
        }

        let filters = {username: username};

        if (req.originalUrl.includes("/transactions/users")) { /* admin route */

            /* check if the user is an admin */
            let validation = verifyAuth(req, res, {authType: "Admin"})
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }


        } else { /* normal users route */


            /* check if the user is authenticated and if is the one of the request */
            let validation = verifyAuth(req, res, {
                authType: "User",
                username: username,
            })
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }
        }

        if (req.query.date || req.query.from || req.query.upTo || req.query.min || req.query.max) {
            if (!req.query.date && !req.query.from && !req.query.upTo) {
                filters = {...filters, ...handleAmountFilterParams(req)};
            } else if (!req.query.min && !req.query.max) {
                filters = {...filters, ...handleDateFilterParams(req)};
            } else {
                filters = {...filters, ...handleAmountFilterParams(req), ...handleDateFilterParams(req)};
            }
        }




        const retrieved = await transactions.find(filters);
        let to_be_returned = [];

        for (const element of retrieved) {

            let cat = await categories.findOne({type: element.type});

            let transaction = {
                username: element.username,
                amount: element.amount,
                type: element.type,
                date: element.date,
                color: cat.color
            };
            to_be_returned.push(transaction);

        }

        return res.status(200).json({
            data: to_be_returned,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Return all transactions made by a specific user filtered by a specific category
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
 - Optional behavior:
 - empty array is returned if there are no transactions made by the user with the specified category
 - error 401 is returned if the user or the category does not exist
 */
export const getTransactionsByUserByCategory = async (req, res) => {
    try {

        const username = req.params.username;
        const category = req.params.category;

        /* check if the username exists */
        const db_user = await User.findOne({username: username});
        if (!db_user) {
            return res.status(400).json({error: "The username doesn't exist"});
        }
        /* check if the category exists */
        const db_category = await categories.findOne({type: category});
        if (!db_category) {
            return res.status(400).json({
                error: "The category don't exists"
            });
        }

        if (req.originalUrl.includes("/transactions/users")) { /* admin route */

            /* check if the user is an admin */
            let validation = verifyAuth(req, res, {authType: "Admin"})
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }

        } else {

            /* check if the user is authenticated */
            let validation = verifyAuth(req, res, {
                authType: "User",
                username: username,
            })
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }

        }

        const retrieved = await transactions.find({
            username: username,
            type: category
        });

        let to_be_returned = [];

        for (const element of retrieved) {

            let cat = await categories.findOne({type: element.type});

            let transaction = {
                username: element.username,
                amount: element.amount,
                type: element.type,
                date: element.date,
                color: cat.color
            };
            to_be_returned.push(transaction);
        }

        return res.status(200).json({
            data: to_be_returned,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Return all transactions made by members of a specific group
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
 - Optional behavior:
 - error 401 is returned if the group does not exist
 - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
    try {

        const group = req.params.name;
        const db_group = await Group.findOne({name: group});
        if (!db_group) {
            return res.status(400).json({error : "The group does not exists"});
        }

        if (req.originalUrl.includes("/transactions/group")) { /* admin route */
            /* check if the user is an admin */
            let validation = verifyAuth(req, res, {authType: "Admin"})
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }
        } else {
            /* check if the user is in the group */
            const user = await User.findOne({refreshToken: req.cookies.refreshToken});
            let found = false;
            for (const member of db_group.members) {
                if (member.email === user.email) {
                    found = true;
                }
            }
            if (!found) {
                return res.status(401).json({error: "The user is not part of the specified group"});
            }
        }

        let to_be_returned = [];

        for (const member of db_group.members) {

            const user = await User.findOne({
                email: member.email,
            });

            const retrieved = await transactions.find({
                username: user.username
            });

            for (const element of retrieved) {

                let cat = await categories.findOne({type: element.type});

                let transaction = {
                    username: element.username,
                    amount: element.amount,
                    type: element.type,
                    date: element.date,
                    color: cat.color
                };
                to_be_returned.push(transaction);
            }
        }

        return res.status(200).json({
            data: to_be_returned,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });


    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
};

/**
 * Return all transactions made by members of a specific group filtered by a specific category
 - Request Body Content: None
 - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
 - Optional behavior:
 - error 401 is returned if the group or the category does not exist
 - empty array must be returned if there are no transactions made by the group with the specified category
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
    try {

        const group = req.params.name;
        const db_group = await Group.findOne({name: group});
        if (!db_group) {
            throw new Error("The group does not exists");
        }
        const category = req.params.category;
        /* checks if the category exists */
        const db_category = await categories.findOne({type: category});
        if (!db_category) {
            return res.status(400).json({
                error: "The category does not exists"
            });
        }

        if (req.originalUrl.includes("/transactions/group")) { /* admin route */
            /* check if the user is an admin */
            let validation = verifyAuth(req, res, {authType: "Admin"})
            if (validation.flag === false) {
                return res.status(401).json({error: validation.cause});
            }
        } else {
            /* check if the user is in the group */
            const user = await User.findOne({refreshToken: req.cookies.refreshToken});
            let found = false;
            for (const member of db_group.members) {
                if (member.email === user.email) {
                    found = true;
                }
            }

            if (!found) {
                return res.status(401).json({error: "The user is not part of the specified group"});
            }
        }

        let to_be_returned = [];

        for (const member of db_group.members) {

            const user = await User.findOne({
                email: member.email,
            });

            const retrieved = await transactions.find({
                username: user.username,
                type: db_category.type,
            });

            for (const element of retrieved) {

                let cat = await categories.findOne({type: element.type});

                let transaction = {
                    username: element.username,
                    amount: element.amount,
                    type: element.type,
                    date: element.date,
                    color: cat.color
                };
                to_be_returned.push(transaction);
            }
        }

        return res.status(200).json({
            data: to_be_returned,
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });


    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Delete a transaction made by a specific user
 - Request Body Content: The `_id` of the transaction to be deleted
 - Response `data` Content: A string indicating successful deletion of the transaction
 - Optional behavior:
 - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {

        const username = req.params.username;
        /* check if the username exists */
        let user = await User.findOne({username: username});
        if (!user) {
            throw new Error("The username don't exists");
        }

        const param_id = req.body._id;
        if (!param_id) {
            return res.status(400).json({
                error: "The body is empty"
            });
        }
        const transaction = await transactions.findOne({_id: param_id});
        if (!transaction) {
            return res.status(400).json({
                error: "Id is not specified"
            });
        }

        /* let's manage authN */
        let validation = verifyAuth(req, res, {
            authType: "Admin",
        })
        if (validation.flag === false) {
            validation = verifyAuth(req, req, {
                authType: "User",
                username: username,
            })
            if (validation.flag === false) {
                return res.status(401).json({
                    error: "User not authenticated"
                });
            } else {
                /* check if the transaction does not belong to the calling user */
                if (transaction.username !== username) {
                    return res.status(400).json({error: "The transaction don't belong to you"});
                }
            }
        }

        /* if we are here we can finally delete the transaction */
        await transactions.deleteOne({_id: param_id});
        return res.status(200).json({
            data: {
                message: "Transaction deleted"
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });

    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};

/**
 * Delete multiple transactions identified by their ids
 - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
 - Response `data` Content: A message confirming successful deletion
 - Optional behavior:
 - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
    try {

        /* only admin can call this function */
        let validation = verifyAuth(req, res, {authType: "Admin"})
        if (validation.flag === false) {
            return res.status(401).json({error: validation.cause})
        }

        let ids = req.body._ids;
        if (!ids) {
            throw new Error("Please specify a list of ids in form of an array.");
        }

        for (const id of ids) {
            if (id === "") {
                return res.status(400).json({
                    error: "Ids cannot be empty strings",
                });
            }
            const present = await transactions.findOne({_id: id});
            if (!present) {
                return res.status(400).json({
                    error: "Ids needs to be present in the db",
                });
            }
        }

        /* if here we can delete the transactions */
        for (const id of ids) {
            await transactions.deleteOne({_id: id});
        }

        return res.status(200).json({
            data: {
                message: "Transactions deleted"
            },
            refreshedTokenMessage: res.locals.refreshedTokenMessage
        });


    } catch (error) {
        res.status(400).json({
            error: error.message,
        });
    }
};
