import request from 'supertest';
import { app } from '../app';
import { Group, User } from '../models/User.js';
import { transactions } from '../models/model.js';
import { verifyAuth } from '../controllers/utils';
import { getUsers,getUser,createGroup,getGroups, getGroup, addToGroup, deleteUser, deleteGroup, removeFromGroup } from '../controllers/users.js'

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
jest.mock("../models/model.js")
jest.mock("../controllers/utils.js", () => ({
  verifyAuth: jest.fn()
}))

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear()
  User.findOne.mockClear()
  User.countDocuments.mockClear()
  Group.create.mockClear()
  Group.find.mockClear()
  Group.findOneAndUpdate.mockClear()
  Group.findOne.mockClear()
  Group.create.mockClear()
  verifyAuth.mockClear()
});

describe("getUsers", () => {
  //TEST_CASE_1 : Function called by an authenticated user who is not an admin  
  test("Should return a 401 error if called by an authenticated user who is not an admin", async () => {
    
    //Mock of the Request cookie (no body needed)
    const mockReq = {
      cookies: "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
    }

    //Mock of the Response
    const mockRes = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    //Mock of the verifyAuth behavior --> no Admin
    verifyAuth.mockReturnValue({flag: false, cause: "The user is not an Admin"})

    await getUsers(mockReq, mockRes)
    expect(verifyAuth).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: "Unauthorized, only Admin can access Users informations"})
  })

  //TEST_CASE_2 : No user inside DB --> return empty list
  test("Should retrieve an empty list of users", async () => {
    //Mock of the Request cookie (no body needed)
    const mockReq = {
      cookies: "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
    }

    //Mock of the Response
    const mockRes = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    //Mock of the verifyAuth behavior --> Admin
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
    //Mock of countDocuments behavior --> return 0 (no users inside the DB)
    jest.spyOn(User, "countDocuments").mockImplementation(() => 0)

    await getUsers(mockReq, mockRes)
    expect(verifyAuth).toHaveBeenCalled()
    expect(User.countDocuments).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: [], refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
  })

  //TEST_CASE_3 : return list of users
  test('Should return the full list of users', async () => {
    //Mock of the Request cookie (no body needed)
    const mockReq = {
      cookies: "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
    }

    //Mock of the Response
    const mockRes = { 
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    const returnedUsers = [{ username: "mariorossi", email: "mariorossi@esempio.com", role: "User" }]

    //Mock of the verifyAuth behavior --> Admin
    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})
    //Mock of countDocuments behavior
    jest.spyOn(User, "countDocuments").mockImplementation(() => 1)
    jest.spyOn(User, "find").mockImplementation(() => returnedUsers)

    await getUsers(mockReq, mockRes)
    expect(verifyAuth).toHaveBeenCalled()
    expect(User.countDocuments).toHaveBeenCalled()
    expect(User.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: returnedUsers, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
  })

  test("General 500 error", async () => {

    //Mock of the Request cookie (no body needed)
    const mockReq = {
      cookies: "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
    }

    //Mock of the Response
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    //Mock of the verifyAuth behavior --> no Admin
    verifyAuth.mockImplementation(() => {throw new Error("General Error")})

    await getUsers(mockReq, mockRes)
    expect(verifyAuth).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

})

describe("getUser", () => { 
  test('should return user information when user exists', async () => {

    const mockReq = {params:{
      username:"testUser"
    }}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    //making mock user
    const user = {
      username: 'testUser',
      email: 'user@test.com',
      role: 'User'
    };

    verifyAuth.mockReturnValue({flag: true, cause: "Authorized"})

    //jest.spyOn(User, 'findOne').mockResolvedValueOnce(user)
    jest.spyOn(User, "findOne").mockImplementation(() => user)//user

    await getUser(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    //expect(utils.verifyAuth).toHaveBeenCalledWith(req, res, {authType: "User"});
    expect(User.findOne).toHaveBeenCalled()
    //expect(User.findOne).toHaveBeenCalledWith( user)
    expect(mockRes.json).toHaveBeenCalledWith({data: user, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
    expect(mockRes.status).toHaveBeenCalledWith(200)//200
  });

  test('should return 400 error when user is not found', async () => {

    const mockReq = {params:{
      username:"nonExistingUser"
    }}
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "abc"
      }
    }

    //jest.spyOn(User, 'findOne').mockResolvedValueOnce(user)
    jest.spyOn(User, "findOne").mockImplementation(null)//user

    await getUser(mockReq, mockRes);

    //expect(verifyAuth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalled()
    expect(mockRes.json).toHaveBeenCalledWith({error: 'User not found in the DB'})
    expect(mockRes.status).toHaveBeenCalledWith(400)
    
  });

  test('should return a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter nor an admin', async () => {
    const mockReq = {
      params: {
        username: 'Mario',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };
  
    // Simulate an authenticated user who is neither the same user nor an admin
    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: 'Unauthorized: You are not allowed to access this user data.',
      authType: 'User', // or 'Admin' depending on the scenario
    });

    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: 'Unauthorized: You are not allowed to access this user data.',
      authType: 'User', // or 'Admin' depending on the scenario
    });
  
    // Simulate a user who is different from the one in the route parameter
    jest.spyOn(User, 'findOne').mockResolvedValue({
      username: 'AnotherUser',
      email: 'anotheruser@example.com',
      role: 'Regular',
    });
  
    await getUser(mockReq, mockRes);
  
    expect(verifyAuth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalledWith({"username": "Mario"}, "username email role -_id");
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized: You are not allowed to access this user data.',
    });
    expect(mockRes.status).toHaveBeenCalledWith(401);
    
  });

  test('should return a 200 if called by an admin who is not the same user as the one in the route parameter', async () => {
    const mockReq = {
      params: {
        username: 'Mario',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    // Simulate a user who is different from the one in the route parameter
    jest.spyOn(User, 'findOne').mockResolvedValue({
      username: 'AnotherUser',
      email: 'anotheruser@example.com',
      role: 'Regular',
    });

    // Simulate an authenticated user who is neither the same user nor an admin
    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: 'Authorized',
      authType: 'Admin', 
    });

    verifyAuth.mockReturnValueOnce({
      flag: true,
      cause: 'Authorized',
      authType: 'Admin',
    });
  

    await getUser(mockReq, mockRes);
  
    expect(verifyAuth).toHaveBeenCalled();
    expect(User.findOne).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({data: {username: 'AnotherUser',email: 'anotheruser@example.com',role: 'Regular',}, refreshedTokenMessage: mockRes.locals.refreshedTokenMessage})
    expect(mockRes.status).toHaveBeenCalledWith(200)
    
  });

  test('general error', async () => {
    const mockReq = {};

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    await getUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500)

  });


})

//TO BE REVIEWED FIXED--------------------------------
describe("createGroup", () => {

  test('General Error 500', async () => {

    const mockReq = {};


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };


    createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  test('Returns a 401 error if called by a user who is not authenticated (authType = Simple)', async () => {

    const mockReq = {
      body: {
        name: 'Family',
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };


    verifyAuth.mockReturnValue({flag: false, cause: 'Unauthorized'});
    createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The user is not authenticated"})
  });

  test("The request body does not contain all the necessary attributes", async () => {

    const mockReq = {
      body: {
        //Missing body
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The request body does not contain all the necessary attributes"})
  });

  test("The group name passed in the request body is an empty string", async () => {

    const mockReq = {
      body: {
        name : "",
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The group name passed in the request body is an empty string"})
  });

  test("The group name passed in the request body represents an already existing group in the database", async () => {

    const mockReq = {
      body: {
        name : "Family",
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundGroup = {name : "Family"}


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    jest.spyOn(Group, "findOne").mockImplementation(() => foundGroup);

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The group name passed in the request body represents an already existing group in the database"})
  });

  test("The user who calls the API is already in a group", async () => {

    const mockReq = {
      body: {
        name : "Family",
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundUser = {email : "tonno@gmail.com"}


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => foundUser)
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => true)

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The user who calls the API is already in a group"})
  });

  test("At least one of the member emails is not in a valid email format", async () => {

    const mockReq = {
      body: {
        name : "Family",
        memberEmails: ['mario.red.email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundUser = {email : "tonno@gmail.com"}


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => foundUser)
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => false)

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "At least one of the member emails is not in a valid email format"})
  });

  test("At least one of the member emails is an empty string", async () => {

    const mockReq = {
      body: {
        name : "Family",
        memberEmails: ['', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundUser = {email : "tonno@gmail.com"}


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => foundUser)
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => false)

    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "At least one of the member emails is an empty string"})
  });

  test("All the `memberEmails` either do not exist or they are already in a group", async () => {

    const members = ["tonno@gmail.com", "primo@gmail.com", "secondo@gmail.com", "terzo@gmail.com"]
    const mockReq = {
      body: {
        name : "Family",
        memberEmails: members,
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundUser = {email : "tonno@gmail.com"}


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    const spy1 = jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
    const spy2 = jest.spyOn(User, "findOne").mockImplementationOnce(() => foundUser)
    spy1.mockImplementationOnce(() => false)

    //case member do not exists
    spy2.mockImplementationOnce(() => true)
    spy1.mockImplementationOnce(() => false)

    //case member is in group
    spy2.mockImplementationOnce(() => true)
    spy1.mockImplementationOnce(() => true)

    spy2.mockImplementationOnce(() => {_id : 12345})
    spy1.mockImplementationOnce(() => true)

    spy2.mockImplementationOnce(() => {_id : 123489})
    spy1.mockImplementationOnce(() => true)


    await createGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({error: "All the `memberEmails` either do not exist or they are already in a group"})
  });

  test("Group created successfully", async () => {

    const members = ["tonno@gmail.com", "primo@gmail.com", "secondo@gmail.com", "terzo@gmail.com"]
    const mockReq = {
      body: {
        name : "Family",
        memberEmails: members,
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    const foundUser = {email : "tonno@gmail.com"}

    const secondo = { email : "secondo@gmail.com", _id : 1234 }
    const terzo = { email : "terzo@gmail.com", _id : 123456 }


    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => null);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => foundUser)
    jest.spyOn(Group, "findOne").mockImplementationOnce(() => false)

    //case member not found
    jest.spyOn(User, "findOne").mockImplementationOnce((email) => false)
    jest.spyOn(Group, "findOne").mockImplementationOnce((member) => false)

    //case member is in group --> primo@
    jest.spyOn(User, "findOne").mockImplementationOnce((email) => true)
    jest.spyOn(Group, "findOne").mockImplementationOnce((member) => true)

    //case member can be added (last two members)
    jest.spyOn(User, "findOne").mockImplementationOnce((email) => secondo)
    jest.spyOn(Group, "findOne").mockImplementationOnce((member) => false)

    jest.spyOn(User, "findOne").mockImplementationOnce((email) => terzo)
    jest.spyOn(Group, "findOne").mockImplementationOnce((member) => false)

    jest.spyOn(Group, "create").mockImplementationOnce(() => {})


    await createGroup(mockReq, mockRes);

    const expectedResult = {
      data : {
        group: {
          name: "Family",
          members: [{email : "secondo@gmail.com"}, {email : "terzo@gmail.com"}],
        },
        alreadyInGroup: [{email : "primo@gmail.com"}],
        membersNotFound: [{email : "tonno@gmail.com"}],
      },
      refreshedTokenMessage: mockRes.locals.refreshedTokenMessage
    }

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expectedResult)
  });

  test('Returns a 401 error if called by a user who is not authenticated (authType = Simple)', async () => {

    const mockReq = {
      body: {
        name: 'Family',
        memberEmails: ['mario.red@email.com', 'luigi.red@email.com'],
      },
      cookies: {
        accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
      },
    };


    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };


    verifyAuth.mockReturnValue({flag: false, cause: 'Unauthorized'});
    createGroup(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({error: "The user is not authenticated"})
  });


});

describe("getGroups", () => {
  test('should return an array of groups when called by an authenticated admin', async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});
  
    // Simulate groups data
    const groupsData = [
      { name: 'Family', members: [{ email: 'mario@example.com' }, { email: 'luigi@example.com' }] },
      { name: 'Friends', members: [{ email: 'peach@example.com' }, { email: 'toad@example.com' }] },
    ];
    
    // Mock the Group.find().select() chain
    const selectMock = jest.fn().mockResolvedValue(groupsData);
    const findMock = jest.fn(() => ({ select: selectMock }));
    jest.spyOn(Group, 'find').mockImplementation(findMock);

    await getGroups(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalled();
    expect(Group.find).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: groupsData,
      refreshedTokenMessage: 'abc',
    });
  });

  test('should return a 401 error if called by an authenticated user who is not an admin', async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    // Simulate an authenticated user who is not an admin
    verifyAuth.mockReturnValue({
      flag: false,
      cause: 'Unauthorized, only Admin can access Groups informations'
    });
  
    await getGroups(mockReq, mockRes);
  
    expect(verifyAuth).toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Unauthorized, only Admin can access Groups informations',
    });
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  test('General Error', async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Simulate an authenticated user who is not an admin
    verifyAuth.mockImplementation(() => {throw new Error("General Error")});

    await getGroups(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });


});

 describe("getGroup", () => {
  test('should return a group if called by an authenticated user who is part of the group', async () => {
    const mockReq = {
      params: {
        name: 'Family',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };
  
    // Simulate an authenticated user who is part of the group
    verifyAuth.mockReturnValue({
      flag: true,
      cause: 'Authorized',
      authType: 'Admin',
    });

    // Simulate the existence of the group in the database
    const groupMock = {
      name: 'Family',
      members: [
        { email: 'mario@example.com' },
        { email: 'luigi@example.com' },
      ],
    };

    // Mock the findOne and select methods of the Group model
    jest.spyOn(Group, 'findOne').mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce({
        name: 'Family',
        members: [
          { email: 'mario@example.com' },
          { email: 'luigi@example.com' },
        ],
      }),
    });
  
    await getGroup(mockReq, mockRes);
  
    
    expect(verifyAuth).toHaveBeenCalled();
    expect(Group.findOne).toHaveBeenCalledWith({ name: 'Family' });
    expect(mockRes.json).toHaveBeenCalledWith({
      data: {
        group: {
          name: 'Family',
          members: [
            { email: 'mario@example.com' },
            { email: 'luigi@example.com' },
          ],
        },
      },
      refreshedTokenMessage: 'abc',
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should return a 400 error if the group name does not exist', async () => {
    const mockReq = {
      params: {
        name: 'NonExistingGroup',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    // Simulate the group not being found in the database
    jest.spyOn(Group, 'findOne').mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce(null),
    });
  
    await getGroup(mockReq, mockRes);
  
    expect(Group.findOne).toHaveBeenCalledWith({ name : 'NonExistingGroup' });
    expect(mockRes.json).toHaveBeenCalledWith({ error : 'Group not found' });
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  //This test when user is not admin
  test('should return a 401 error if called by an authenticated user who is neither part of the group nor an admin', async () => {
    const mockReq = {
      params: {
        name: 'Family',
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Simulate the existence of the group in the database
    const groupMock = {
      name: 'Family',
      members: [
        { email: 'mario@example.com' },
        { email: 'luigi@example.com' },
      ],
    };

    // Mock the findOne and select methods of the Group model
    jest.spyOn(Group, 'findOne').mockReturnValueOnce({
      select: jest.fn().mockReturnValueOnce(groupMock),
    });

    // Simulate an authenticated user who is neither part of the group nor an admin
    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: 'Unauthorized',
      authType: 'User',
    });

    // Simulate an authenticated user who is neither part of the group nor an admin
    verifyAuth.mockReturnValueOnce({
      flag: false,
      cause: 'Unauthorized',
      authType: 'User',
    });

    await getGroup(mockReq, mockRes);

    expect(verifyAuth).toHaveBeenCalledTimes(2);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User who is neither part of the group nor an admin' });
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

   test('should return a group if called by an authenticated user who is part of the group', async () => {
     const mockReq = {
       params: {
         name: 'Family',
       },
     };
     const mockRes = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };


     // Simulate the existence of the group in the database
     const groupMock = {
       name: 'Family',
       members: [
         { email: 'mario@example.com' },
         { email: 'luigi@example.com' },
       ],
     };

     // Mock the findOne and select methods of the Group model
     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(groupMock),
     });

     // Simulate an authenticated user who is neither part of the group nor an admin
     verifyAuth.mockReturnValueOnce({
       flag: false,
       cause: 'Unauthorized',
       authType: 'User',
     });

     // Simulate an authenticated user who is neither part of the group nor an admin
     verifyAuth.mockReturnValueOnce({
       flag: true,
       cause: 'Unauthorized',
       authType: 'User',
     });

     await getGroup(mockReq, mockRes);

     expect(verifyAuth).toHaveBeenCalledTimes(2);
     expect(mockRes.json).toHaveBeenCalledWith({
       data: {
         group: {
           name: 'Family',
           members: [
             { email: 'mario@example.com' },
             { email: 'luigi@example.com' },
           ],
         },
       },
       refreshedTokenMessage: 'abc',
     });     expect(mockRes.status).toHaveBeenCalledWith(200);
   });


 })

 describe("addToGroup", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("The request body does not contain all the necessary attributes", async () => {
    const req = {
      body: {
        emails : ['newmember1@example.com', 'newmember2@example.com']
      },
      params : {

      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'abc',
      },
    };

    await addToGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "The request body does not contain all the necessary attributes"});
  });

   test("Group not found", async () => {
     const req = {
       body: {
         emails : ['newmember1@example.com', 'newmember2@example.com']
       },
       params : {
          name : "Family"
       }
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(null),
     });
     await addToGroup(req, res);
     expect(res.json).toHaveBeenCalledWith({error: "Group not found"});
     expect(res.status).toHaveBeenCalledWith(400);

   });

   test("At least one of the member emails is not in a valid email format", async () => {
     const req = {
       body: {
         emails : ['newmember1.example.com', 'newmember2@example.com']
       },
       params : {
         name : "Family"
       }
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family"}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });

     await addToGroup(req, res);

     expect(res.json).toHaveBeenCalledWith({error: "At least one of the member emails is not in a valid email format"});
     expect(res.status).toHaveBeenCalledWith(400);

   });

   test("At least one of the member emails is an empty string", async () => {
     const req = {
       body: {
         emails : ['', 'newmember2@example.com']
       },
       params : {
         name : "Family"
       }
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family"}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });

     await addToGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({error: "At least one of the member emails is an empty string"});


   });

   test("Returns a 401 error if called by an authenticated user who is not part of the group", async () => {
     const req = {
       body: {
         emails : ['newmember1@example.com', 'newmember2@example.com']
       },
       params : {
         name : "Family"
       },
       originalUrl : "/groups/:name/add"
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family", members : [{email : "tonno"}]}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });

     verifyAuth.mockReturnValue({flag: false, cause: 'Unauthorized'});

     await addToGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(401);
     expect(res.json).toHaveBeenCalledWith({error: 'Unauthorized'});


   });

   test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
     const req = {
       body: {
         emails : ['newmember1@example.com', 'newmember2@example.com']
       },
       params : {
         name : "Family"
       },
       originalUrl : "/groups/:name/insert"
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family"}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });

     verifyAuth.mockReturnValueOnce({flag: false, cause: 'Unauthorized'});

     await addToGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(401);
     expect(res.json).toHaveBeenCalledWith({error: 'Unauthorized'});


   });

   test("All the `memberEmails` either do not exist or are already in a group", async () => {
     const members = ["primo@gmail.com", "secondo@gmail.com"]
     const req = {
       body: {
         emails : members
       },
       params : {
         name : "Family"
       },
       originalUrl : "/groups/:name/insert"
     };



     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family"}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });


     verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});

     const spy1 = jest.spyOn(User, "findOne").mockImplementationOnce(() => false)
     const spy2 = jest.spyOn(Group, "findOne").mockImplementationOnce(() => true);

     spy1.mockImplementationOnce(() => true)
     spy2.mockImplementationOnce(() => true)


     await addToGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({error: "All the `memberEmails` either do not exist or are already in a group"});


   });

   test("All the `memberEmails` either do not exist or are already in a group V2 (full coverage)", async () => {
     const members = ["primo@gmail.com", "secondo@gmail.com"]
     const req = {
       body: {
         emails : members
       },
       params : {
         name : "Family"
       },
       originalUrl : "/groups/:name/add"
     };



     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family", members : ["primo@gmail.com"]}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });


     verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});

     const spy1 = jest.spyOn(User, "findOne").mockImplementationOnce(() => false)
     const spy2 = jest.spyOn(Group, "findOne").mockImplementationOnce(() => true);

     spy1.mockImplementationOnce(() => true)
     spy2.mockImplementationOnce(() => true)


     await addToGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({error: "All the `memberEmails` either do not exist or are already in a group"});


   });


   test("Correct behavior", async () => {
     const members = ["primo@gmail.com", "secondo@gmail.com"]
     const req = {
       body: {
         emails : members
       },
       params : {
         name : "Family"
       },
       originalUrl : "/groups/:name/insert"
     };



     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'abc',
       },
     };

     const group = { name : "Family", members : [{email : "primo@gmail.com"}]}

     jest.spyOn(Group, 'findOne').mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce(group),
     });


     verifyAuth.mockReturnValue({flag: true, cause: 'Authorized'});

     const spy1 = jest.spyOn(User, "findOne").mockImplementationOnce(() => true)
     const spy2 = jest.spyOn(Group, "findOne").mockImplementationOnce(() => false);

     spy1.mockImplementationOnce(() => true)
     spy2.mockImplementationOnce(() => false)

     jest.spyOn(Group, 'findOneAndUpdate').mockReturnValue({
       exec: jest.fn().mockReturnValueOnce(null),
     });

     spy2.mockReturnValueOnce({
       select: jest.fn().mockReturnValueOnce({name : "Family", members: [{email: "primo@gmail.com"}, {email : "secondo@gmail.com"}]}),
     });

     await addToGroup(req, res);

     const expectedResult = {
       data : {
         group: {
           name: "Family",
           members: [{email : "primo@gmail.com"}, {email: "secondo@gmail.com"}]
         },
         membersNotFound: [],
         alreadyInGroup: []
       },
       refreshedTokenMessage: res.locals.refreshedTokenMessage
     }

     //expect(res.status).toHaveBeenCalledWith(200);
     expect(res.json).toHaveBeenCalledWith(expectedResult);
   });
 })

describe("removeFromGroup", () => {

  test("General Error", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['', 'member2@example.com'];

    // Mock the request object
    const req = {};

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };
    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(500);

  });

  test("The request body does not contain all the necessary attributes", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    /*
    // Mock the Group model findOne method
    Group.findOne = jest.fn().mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email: 'member2@example.com' },
          { email: 'member3@example.com' },
        ],
      }),
    });
    */
  
    // Mock the request object
    const req = {
      body: {
      },
      params: {
        name: groupName,
      },
      originalUrl: '/groups/Family/remove',
    };
  
    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };
  
    // Call the function
    await removeFromGroup(req, res);
  
    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error : "The request body does not contain all the necessary attributes"})
  });

  test("Group not found", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: '/groups/Family/remove',
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select : jest.fn().mockReturnValue(null)
    });

    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error : "Group not found" })
  });

  test("At least one of the member emails is not in a valid email format", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1.example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: '/groups/Family/remove',
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email: 'member2@example.com' },
          { email: 'member3@example.com' },
        ],
      }),
    });

    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "At least one of the member emails is not in a valid email format"})
  });

  test("At least one of the member emails is an empty string", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: '/groups/Family/remove',
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email: 'member2@example.com' },
          { email: 'member3@example.com' },
        ],
      }),
    });

    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "At least one of the member emails is an empty string"})
  });

  test("The group contains only one member", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: '/groups/Family/remove',
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' }
        ],
      }),
    });

    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "At least one of the member emails is an empty string"})
  });

  test("Called by an authenticated user who is not part of the group", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: "/groups/:name/remove",
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email : 'member2@gmail.com' }
        ],
      }),
    });

    verifyAuth.mockReturnValueOnce( {flag : false , cause : "Unauthorized"})



    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
  });

  test("Called by an authenticated user who is not an admin", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: "/groups/:name/pull",
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email : 'member2@gmail.com' }
        ],
      }),
    });

    verifyAuth.mockReturnValueOnce( {flag : false , cause : "Unauthorized"})



    // Call the function
    await removeFromGroup(req, res);

    // Verify the response
    //expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({error: "Unauthorized"})
  });

  test("All the `memberEmails` either do not exist or are not in the group", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: "/groups/:name/pull",
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email : 'member4@gmail.com' }
        ],
      }),
    });

    verifyAuth.mockReturnValueOnce( {flag : true , cause : "Unauthorized"})

    jest.spyOn(User, "findOne").mockImplementationOnce(() => false);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => true);



    // Call the function
    await removeFromGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "All the `memberEmails` either do not exist or are not in the group"})
  });

  test("All the `memberEmails` either do not exist or are not in the group v2 (full coverage)", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: "/groups/:name/remove",
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email : 'member4@gmail.com' }
        ],
      }),
    });

    verifyAuth.mockReturnValueOnce( {flag : true , cause : "Unauthorized"})

    jest.spyOn(User, "findOne").mockImplementationOnce(() => false);
    jest.spyOn(User, "findOne").mockImplementationOnce(() => true);



    // Call the function
    await removeFromGroup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({error: "All the `memberEmails` either do not exist or are not in the group"})
  });

  test("Removed from group correctly", async () => {
    // Prepare the test data
    const groupName = 'Family';
    const membersToRemove = ['member1@example.com', 'member2@example.com'];

    // Mock the request object
    const req = {
      body: {
        emails : membersToRemove
      },
      params: {
        name: groupName,
      },
      originalUrl: "/groups/:name/pull",
    };

    // Mock the response object
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    // Mock the Group model findOne method
    jest.spyOn(Group, "findOne").mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({
        name: 'Family',
        members: [
          { email: 'member1@example.com' },
          { email : 'member2@example.com' }
        ],
      }),
    });

    verifyAuth.mockReturnValueOnce( {flag : true , cause : "Unauthorized"})

    jest.spyOn(User, "findOne").mockImplementationOnce(() => false);
    jest.spyOn(User, "findOne").mockReturnValueOnce({ _id : 123456789 , name : "Tuna" });

    jest.spyOn(Group, "findOneAndUpdate").mockReturnValueOnce( {
      exec : jest.fn().mockImplementationOnce(() => null)
    })

    jest.spyOn(Group, "findOne").mockReturnValueOnce( {
      select : jest.fn().mockReturnValueOnce({
        exec : jest.fn().mockReturnValueOnce({
          name : "Family",
          members : [ {email :"Tonno"} ]
        })
      })
    });


    // Call the function
    await removeFromGroup(req, res);

    const expectedRes = {
      data : {
        group : {
          name : "Family",
          members : [{email : "Tonno"}]
        },
        membersNotFound : ['member1@example.com'],
        notInGroup : []
      },
      refreshedTokenMessage : res.locals.refreshedTokenMessage
    }

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedRes)
  });

})

describe("deleteUser", () => {

  test('should delete the user and return a success response', async () => {

    const req = {
      body: {
        email: 'luigi.red@email.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    const user = {
      username: 'testUser',
      email: req.body.email,
    };

    const group = {
      name: 'testGroup',
      members: [{ email: req.body.email }],
    };

    // Simulate an authenticated user who is part of the group
    verifyAuth.mockReturnValue({
      flag: true,
      cause: 'Authorized',
      authType: 'Admin',
    });

    // Inside your test function
    jest.spyOn(transactions, "deleteMany").mockReturnValueOnce( {deletedCount : 1} );


    // Mock the User.findOne, User.deleteOne, and Group.findOne functions
    User.findOne.mockResolvedValue(user);
    User.deleteOne.mockResolvedValue();
    Group.findOne.mockResolvedValue(group);

    await deleteUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User.deleteOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(Group.findOne).toHaveBeenCalledWith({ "members.email": req.body.email });
    expect(res.json).toHaveBeenCalledWith({
      data: {
        deletedTransactions: 1,
        deletedFromGroup: true,
      },
      refreshedTokenMessage: 'mockRefreshedTokenMessage',
    });
  });

  test('should delete the user and return a success response - V2 (Full Coverage)', async () => {

    const req = {
      body: {
        email: 'luigi.red@email.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    const user = {
      username: 'testUser',
      email: req.body.email,
    };

    const group = {
      name: 'testGroup',
      members: [{ email: req.body.email }, { email: "Tonno" }],
    };

    // Simulate an authenticated user who is part of the group
    verifyAuth.mockReturnValue({
      flag: true,
      cause: 'Authorized',
      authType: 'Admin',
    });

    // Inside your test function
    jest.spyOn(transactions, "deleteMany").mockReturnValueOnce( {deletedCount : 1} );


    // Mock the User.findOne, User.deleteOne, and Group.findOne functions
    User.findOne.mockResolvedValue(user);
    User.deleteOne.mockResolvedValue();
    Group.findOne.mockResolvedValue(group);

    await deleteUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User.deleteOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(Group.findOne).toHaveBeenCalledWith({ "members.email": req.body.email });
    expect(res.json).toHaveBeenCalledWith({
      data: {
        deletedTransactions: 1,
        deletedFromGroup: true,
      },
      refreshedTokenMessage: 'mockRefreshedTokenMessage',
    });
  });

  test('should delete the user and return a success response - V3 (Full Coverage)', async () => {

    const req = {
      body: {
        email: 'luigi.red@email.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };

    const user = {
      username: 'testUser',
      email: req.body.email,
    };

    const group = {
      name: 'testGroup',
      members: [{ email: req.body.email }, { email: "Tonno" }],
    };

    User.findOne.mockImplementationOnce(() => user);

    // Simulate an authenticated user who is part of the group
    verifyAuth.mockReturnValue({
      flag: true,
      cause: 'Authorized',
      authType: 'Admin',
    });

    User.deleteOne.mockResolvedValue();
    Group.findOne.mockResolvedValue(false);

    // Inside your test function
    jest.spyOn(transactions, "deleteMany").mockReturnValueOnce( {deletedCount : 1} );


    // Mock the User.findOne, User.deleteOne, and Group.findOne functions




    await deleteUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: {
        deletedTransactions: 1,
        deletedFromGroup: false,
      },
      refreshedTokenMessage: 'mockRefreshedTokenMessage',
    });
  });


  test('should return a 400 error if the request body does not contain all the necessary attributes', async () => {
    const req = {
      body: {},
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error : "The request body does not contain all the necessary attributes" });
  });
  
  test('should return a 400 error if the email passed in the request body is an empty string', async () => {
    const req = {
      body: {
        email: '',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "The email passed in the request body is an empty string" });
  });

  test('should return a 400 error if the email passed in the request body is not in correct email format', async () => {
    const req = {
      body: {
        email: 'invalid-email',
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: 'mockRefreshedTokenMessage',
      },
    };
  
    // Inside your test function
    await deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The email passed in the request body is not in correct email format' });
  });
  
  test("should return a 400 error if the email does not represent a user in the database", async () => {
    const req = {
      body: {
        email: "nonexistent@example.com",
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "mockRefreshedTokenMessage",
      },
    };
  
    // Mock the User.findOne function to return null, indicating no user found
    User.findOne.mockResolvedValue(null);
  
    await deleteUser(req, res);
  
    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
  
  test("should return a 401 error if called by an authenticated user who is not an admin", async () => {
    const req = {
      body: {
        email: "test@example.com",
      },
    };
  
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "mockRefreshedTokenMessage",
      },
    };
  
    // Mock the verifyAuth function to return an authenticated user who is not an admin
    verifyAuth.mockReturnValue({
      flag: false,
      cause: "Unauthorized",
    });

    const user = {
      username: 'testUser',
      email: req.body.email,
    };
  
    User.findOne.mockResolvedValue(user);

    await deleteUser(req, res);
  
    expect(verifyAuth).toHaveBeenCalledWith(req, res, { authType: "Admin" });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

 })

 describe("deleteGroup", () => {


   test('should delete the group and return a success response', async () => {
     const req = {
       body: {
         name: 'Family',
       },
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
       locals: {
         refreshedTokenMessage: 'mockRefreshedTokenMessage',
       },
     };

     // Mock the Group.findOne and Group.deleteOne functions
     Group.findOne.mockResolvedValue({name: req.body.name});
     Group.deleteOne.mockResolvedValue();

     // Mock the verifyAuth function to return authorized user
     verifyAuth.mockReturnValue({
       flag: true,
       cause: 'Authorized',
       authType: 'Admin',
     });

     await deleteGroup(req, res);

     expect(verifyAuth).toHaveBeenCalled();
     expect(Group.findOne).toHaveBeenCalledWith({name: req.body.name});
     expect(Group.deleteOne).toHaveBeenCalledWith({name: req.body.name});
     expect(res.status).toHaveBeenCalledWith(200);
     expect(res.json).toHaveBeenCalledWith({
       data: {message: 'Group deleted successfully'},
       refreshedTokenMessage: 'mockRefreshedTokenMessage',
     });
   });

   test('should return a 400 error if the request body does not contain all the necessary attributes', async () => {
     const req = {
       body: {},
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
     };

     await deleteGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({
       error: 'The request body does not contain all the necessary attributes',
     });
   });

   test('should return a 400 error if the name passed in the request body is an empty string', async () => {
     const req = {
       body: {
         name: '',
       },
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
     };

     await deleteGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({
       error: 'The name passed in the request body is an empty string',
     });
   });

   test('should return a 400 error if the name passed in the request body does not represent a group in the database', async () => {
     const req = {
       body: {
         name: 'NonexistentGroup',
       },
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
     };

     // Mock the Group.findOne function to return null, simulating the case where the group is not found
     Group.findOne.mockResolvedValue(null);

     await deleteGroup(req, res);

     expect(res.status).toHaveBeenCalledWith(400);
     expect(res.json).toHaveBeenCalledWith({error: 'Group not found'});
   });

   test('should return a 401 error if called by an authenticated user who is not an admin', async () => {
     const req = {
       body: {
         name: 'GroupToDelete',
       },
     };

     const res = {
       status: jest.fn().mockReturnThis(),
       json: jest.fn(),
     };

     const user = {
       username: 'testUser',
       email: req.body.email,
     };

     User.findOne.mockResolvedValue(user);

     // Mock the verifyAuth function to return non-admin user authentication
     verifyAuth.mockReturnValue({
       flag: false,
       cause: 'Unauthorized',
       authType: 'Admin',
     });

     await deleteGroup(req, res);

     expect(verifyAuth).toHaveBeenCalledWith(req, res, {authType: 'Admin'});
     expect(res.status).toHaveBeenCalledWith(401);
     expect(res.json).toHaveBeenCalledWith({error: 'Unauthorized'});
   });

 })
