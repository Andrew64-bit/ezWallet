import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import {verifyAuth} from "../controllers/utils.js";
import {register,registerAdmin,login,logout} from '../controllers/auth.js'
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
require("dotenv").config();



jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock("../controllers/utils.js", () => ({
    verifyAuth: jest.fn()
}))

beforeEach(() =>{
    User.findOne.mockClear();
    User.create.mockClear();
})

// to implement
describe('register', (req,res) => { 

    test('Response data Content: A message confirming successful insertion', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => null)
            .mockImplementationOnce(() => null);

        jest.spyOn(User, "create").mockImplementation(() => {});

        await register(req,res);
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(User.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data : {message: 'User added successfully'}});
    });

    test('Returns a 400 error if the request body does not contain all the necessary attributes', async () => {
        const req ={
            body:{
                username: "test_username",
                //missing body
                password: "test_password"
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await register(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The request body does not contain all the necessary attributes"});

    });

    test('Returns a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const req ={
            body:{
                username: "Mario", 
                email: "", 
                password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await register(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "At least one of the parameters in the request body is an empty string"});

    });
    test('Returns a 400 error if the email in the request body is not in a valid email format', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.redemail.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await register(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The email in the request body is not in a valid email format"});

    });
    test('Returns a 400 error if the username in the request body identifies an already existing user', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        const existingUser = {
            username: "Mario", email: "mario.red@email.com", role: "User",
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => existingUser);

        await register(req,res);
        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: 'The user in the request body identifies an already existing user'});
    });
    test('Returns a 400 error if the email in the request body identifies an already existing user', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        const existingUser = {
            username: "Mario", email: "mario.red@email.com", role: "User",
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => null)
            .mockImplementationOnce(() => existingUser);

        jest.spyOn(User, "create").mockImplementation(() => {});

        await register(req,res);
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: 'The email in the request body identifies an already existing user'});
    });
});




describe("registerAdmin", (req,res) => {

    test('Response data Content: A message confirming successful insertion', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => null)
            .mockImplementationOnce(() => null);

        jest.spyOn(User, "create").mockImplementation(() => {});

        await registerAdmin(req,res);
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(User.create).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({data: {message: 'Admin added successfully'}});
    });

    test('Returns a 400 error if the request body does not contain all the necessary attributes', async () => {
        const req ={
            body:{
                username: "test_username",
                //missing body
                password: "test_password"
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await registerAdmin(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The request body does not contain all the necessary attributes"});

    });

    test('Returns a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const req ={
            body:{
                username: "Mario",
                email: "",
                password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await registerAdmin(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "At least one of the parameters in the request body is an empty string"});

    });
    test('Returns a 400 error if the email in the request body is not in a valid email format', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.redemail.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await registerAdmin(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The email in the request body is not in a valid email format"});

    });
    test('Returns a 400 error if the username in the request body identifies an already existing user', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        const existingUser = {
            username: "Mario", email: "mario.red@email.com", role: "User",
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => existingUser);

        await registerAdmin(req,res);
        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: 'The user in the request body identifies an already existing user'});
    });

    test('Returns a 400 error if the email in the request body identifies an already existing user', async () => {
        const req ={
            body:{
                username: "Mario", email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        const existingUser = {
            username: "Mario", email: "mario.red@email.com", role: "User",
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => null)
            .mockImplementationOnce(() => existingUser);

        jest.spyOn(User, "create").mockImplementation(() => {});

        await registerAdmin(req,res);
        expect(User.findOne).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: 'The email in the request body identifies an already existing user'});
    });
})





// debugged
describe('login', (req,res) => {

    test('Response data Content: A message confirming successful login', async () => {
        const req ={
            body:{
                email: "mario.red@email.com", password: "securePass",
            },
        }
        const cookies = {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmlvLnJlZEBlbWFpbC5jb20iLCJpZCI6MTIzNDUsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4NTk3NzY2NywiZXhwIjoxNjg1OTgxMjY3fQ.ibMGTIi9yo4vNVU6FM3nbKc3kCBuk-W1xcG6BHV4dbw",
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmlvLnJlZEBlbWFpbC5jb20iLCJpZCI6MTIzNDUsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4NTk3NzY2NywiZXhwIjoxNjg2NTgyNDY3fQ.KMyGqWvrcA1xdKXdYQ4HcOnG7x3gUoKFFWDRk_PDhKo"
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn(),
            cookie : jest.fn().mockResolvedValue(() => cookies)
        }

        const existingUser = {
            id: 12345,
            role : "User",
            username: "Mario",
            email: "mario.red@email.com",
            password: "securePass",
            save : jest.fn().mockResolvedValue()
        }

        jest.spyOn(User, 'findOne').mockImplementationOnce(() => existingUser);
        jest.spyOn(bcrypt, "compare").mockImplementation(() => true);

        await login(req,res);

        expect(User.findOne).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Returns a 400 error if the request body does not contain all the necessary attributes', async () => {
        const req ={
            body:{
                email: "mario.red@email.com",
                //missing body
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await login(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The request body does not contain all the necessary attributes"});

    });

    test('Returns a 400 error if at least one of the parameters in the request body is an empty string', async () => {
        const req ={
            body:{
                email: "", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await login(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "At least one of the parameters in the request body is an empty string"});

    });
    test('Returns a 400 error if the email in the request body is not in a valid email format', async () => {
        const req ={
            body:{
                email: "mario.redemail.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        await login(req,res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The email in the request body is not in a valid email format"});

    });
    test('Returns a 400 error if the email in the request body does not identify a user in the database', async () => {
        const req ={
            body:{
                email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        const existingUser = {
            username: "Mario", email: "mario.red@email.com", role: "User",
        }

        jest.spyOn(User, 'findOne')
            .mockImplementationOnce(() => null);

        await login(req,res);
        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: 'The user in the request body does not identify a user in the database'});
    });
    test("The supplied password does not match with the one in the database", async () => {
        const req ={
            body:{
                email: "mario.red@email.com", password: "securePass",
            },
        }
        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        jest.spyOn(User, 'findOne').mockResolvedValueOnce({ username: "Mario", email: "mario.red@email.com", role: "User", password : "sbagliata"});
        jest.spyOn(bcrypt, "compare").mockImplementation(() => false);

        await login(req,res);
        expect(User.findOne).toHaveBeenCalled();
        //expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error: "The supplied password does not match with the one in the database"});
    });

});


//debugged
describe('logout', (req,res) => {

    beforeEach(() =>{
        User.findOne.mockClear();
    })
    test('Response data Content: A message confirming successful logout    ',async  () => {

        const cookies = {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmlvLnJlZEBlbWFpbC5jb20iLCJpZCI6MTIzNDUsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4NTk3NzY2NywiZXhwIjoxNjg1OTgxMjY3fQ.ibMGTIi9yo4vNVU6FM3nbKc3kCBuk-W1xcG6BHV4dbw",
            refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmlvLnJlZEBlbWFpbC5jb20iLCJpZCI6MTIzNDUsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4NTk3NzY2NywiZXhwIjoxNjg2NTgyNDY3fQ.KMyGqWvrcA1xdKXdYQ4HcOnG7x3gUoKFFWDRk_PDhKo"
        }

        const req ={
            body:{
                email: "mario.red@email.com", password: "securePass",
            },
            cookies : cookies
        }

        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn(),
            cookie : jest.fn().mockResolvedValue(() => cookies)
        }

        const existingUser = {
            id: 12345,
            role : "User",
            username: "Mario",
            email: "mario.red@email.com",
            password: "securePass",
            save : jest.fn().mockReturnThis(),
            refreshToken : {}
        }

        jest.spyOn(User, 'findOne').mockReturnValue({
            id: 12345,
            role : "User",
            username: "Mario",
            email: "mario.red@email.com",
            password: "securePass",
            save : jest.fn().mockReturnThis(),
            refreshToken : {}
        });

        await logout(req,res);

        //expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data:{ message: "User logged out" }});
    });
    test('Returns a 400 error if the request does not have a refresh token in the cookies',async  () => {
        const cookies = {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1hcmlvLnJlZEBlbWFpbC5jb20iLCJpZCI6MTIzNDUsInVzZXJuYW1lIjoiTWFyaW8iLCJyb2xlIjoiVXNlciIsImlhdCI6MTY4NTk3NzY2NywiZXhwIjoxNjg1OTgxMjY3fQ.ibMGTIi9yo4vNVU6FM3nbKc3kCBuk-W1xcG6BHV4dbw",
        }

        const req ={
            body:{
                email: "mario.red@email.com", password: "securePass",
            },
            cookies : cookies
        }

        const res={
            status:jest.fn().mockReturnThis(),
            json : jest.fn(),
            cookie : jest.fn().mockResolvedValue(() => cookies)
        }

        await logout(req,res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({error : "The request does not have a refresh token in the cookies"});
    });
    test('Returns a 400 error if the refresh token in the request"s cookies does not represent a user in the database',async  () => {
        const req = {
            cookies : {
                refreshToken : "a"
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json : jest.fn()
        }

        jest.spyOn(User, "findOne").mockResolvedValue(false)

        await logout(req,res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "The refresh token in the request's cookies does not represent a user in the database" });
    });

});
