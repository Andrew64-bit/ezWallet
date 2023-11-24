import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

const adminAccessTokenValid = jwt.sign({
  email: "filippo-admin@somedomain.com",
  //id: existingUser.id, The id field is not required in any check, so it can be omitted
  username: "filippo-admin",
  role: "Admin"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

const testerAccessTokenValid = jwt.sign({
  email: "filippo-user@somedomain.com",
  username: "filippo-user",
  password:"password123",
  role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '1y' })

// noinspection SpellCheckingInspection
const adminRefreshToken = adminAccessTokenValid;
const userRefreshToken = testerAccessTokenValid;
const adminCookies = `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`;
const userCookies = `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`;

// noinspection SpellCheckingInspection
/**const adminAccessToken = "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwiaWQiOiI2NDY0Y2E4YmI5YTMxNDYwYjgxNzJhOWUiLCJ1c2VybmFtZSI6ImZpbGlwcG8tYWRtaW4iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODU0NjIwNzMsImV4cCI6MTY4NTQ2NTY3M30.9sv3_FFCJcEuKPTSnSwAImAP9l_nTcgQL8AyvokOKvc";
const userAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjQ5NzIsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0.8R8JA2-8Z8JJIgipon0KQcGoHvxHsN7Fmdx5k4CevvI";
const adminRefreshToken = "refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwiaWQiOiI2NDY0Y2E4YmI5YTMxNDYwYjgxNzJhOWUiLCJ1c2VybmFtZSI6ImZpbGlwcG8tYWRtaW4iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE2ODU0NjIwNzMsImV4cCI6MTY4NjA2Njg3M30.fdOaghjMbsdMbIvaDk23KBNVUSOkZUbgP5IomUxOanQ";
const userRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s";
const adminCookies = `${adminAccessToken}; ${adminRefreshToken}`;
const userCookies = `${userAccessToken}; ${userRefreshToken}`;*/

describe("getUsers", () => {
  /**
   * Database is cleared before each test case, in order to allow insertion of data tailored for each specific test case.
   */
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test("Should retriev all users", async() => {

    const to_check_users = [
      { 
        username: 'filippo-admin',
        email: 'filippo-admin@somedomain.com'
      },
      { 
        username: 'filippo-user',
        email: 'filippo-user@somedomain.com'
      },
  ];

    await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    })
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    })

    const res = await request(app).get('/api/users').set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    //expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].username).toEqual("filippo-admin")

    expect(res.body.data).toMatchObject(
      to_check_users.map(user => ({
          ...user
      }))
    );

  })

  test("Should retriev 401 error when called with authenticated user who is not admin", async() => {

    const to_check_users = [
      { 
        username: 'filippo-admin',
        email: 'filippo-admin@somedomain.com'
      },
      { 
        username: 'filippo-user',
        email: 'filippo-user@somedomain.com'
      },
    ];

    
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'Regular'
    })
    await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    })

    const res = await request(app).get('/api/users').set("Cookie", userCookies);

    //expect(res.error).toEqual("");
    //expect(res.body.data).toEqual("filippo-admin")
    expect(res.error).toBeDefined();
    expect(res.body.error).toEqual("Unauthorized, only Admin can access Users informations");
    expect(res.status).toBe(401);
    //expect(res.body.data).toHaveLength(1)

  });

})

describe("getUser", () => {

  beforeEach(async () => {
    await User.deleteMany({})
  })


  test("Should retrieve user information", async () => {
    const username = "filippo-user";
    
    const to_check_user = {
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      role: "User"
    };

    // Create the user in the database
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    })

    // Make a request to the API to get the user
    const res = await request(app).get(`/api/users/filippo-user`).set("Cookie", userCookies);

    expect(res.status).toBe(200);
    //expect(res.body.data).toHaveLength(1)
    expect(res.body.data.username).toEqual("filippo-user")
    expect(JSON.stringify(res.body.data)).toEqual(JSON.stringify(to_check_user));

  });

  test("Should retrieve different users information if admin", async () => {
    const username = "filippo-user";
    
    const to_check_user = {
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      role: "User"
    };

    // Create the user in the database
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    })
    await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    })

    // Make a request to the API to get the user
    const res = await request(app).get(`/api/users/filippo-user`).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    //expect(res.body.data).toHaveLength(1)
    expect(res.body.data.username).toEqual("filippo-user")
    expect(JSON.stringify(res.body.data)).toEqual(JSON.stringify(to_check_user));

    });

  test("Return error 400 if user is not one in the database", async() => {

    // Create the user in the database
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    })

    // Make a request to the API to get the user
    const res = await request(app).get(`/api/users/nonExistingUser`).set("Cookie", userCookies);

    //expect(res.error).toEqual("");
    //expect(res.body.data).toEqual("filippo-admin")
    expect(res.error).toBeDefined();
    expect(res.body.error).toEqual("User not found in the DB");
    expect(res.status).toBe(400);

  });

  test("Return error 401 if users is not admin, or the one in the parameter", async() => {

    // Create the user in the database
    await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'Regular'
    })

    await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    })

    // Make a request to the API to get the user
    const res = await request(app).get(`/api/users/filippo-admin`).set("Cookie", userCookies);

    expect(res.error).toBeDefined();
    expect(res.body.error).toEqual("Token has a username different from the requested one");
    expect(res.status).toBe(401);

  });

})

describe("createGroup", () => { 

  beforeEach(async () => {
      await User.deleteMany();
      await Group.deleteMany();
  });

  test("Should create a group in normal state", async () => {

    const to_check_group = {
      name: "testing-group-1",
      members: 
      [{email: "filippo-admin@somedomain.com"},
      {email: "filippo-user@somedomain.com"}]
    }

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        default_user.email
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));
    /*expect(res.body.data.group).toMatchObject(
      to_check_group.map(group => ({
        ...group,
      }))
    );*/

  })

  test("Should create a group in normal state when called by normal user", async () => {

    const to_check_group = {
      name: "testing-group-1",
      members: 
      [{email: "filippo-admin@somedomain.com"},
      {email: "filippo-user@somedomain.com"}]
    }

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        default_user.email
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("Checks if the user who calls the API does not have their email in the list of emails then their email is added to the list of members", async () => {

    const to_check_group = {
      name: "testing-group-1",
      members: 
      [{email: "filippo-user@somedomain.com"},
      {email: "filippo-admin@somedomain.com"}
      ]
    }

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        default_user.email
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("Should return error 400 when req body doesn't contain all attributes)", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1"
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The request body does not contain all the necessary attributes");

  })

  test("should return a 400 error if the group name passed in the request body is an empty string", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "",
      memberEmails: [
        admin_user.email,
        default_user.email
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The group name passed in the request body is an empty string");

  })
 
  test("should return a 400 error if the group name passed in the request body represents an already existing group in the database", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        default_user.email
      ]
    };

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
          {
              email: default_user.email,
              user: default_user._id
          },
      ]
    });

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The group name passed in the request body represents an already existing group in the database");

  })

  test("should return a 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        "non_existing@somedoamin.com"
      ]
    };

    await Group.create({
      name: "testing-group-2",
      members: [
          {
            email: "non_existing@somedoamin.com",
            user: admin_user._id
        }
      ]
    });

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("All the `memberEmails` either do not exist or they are already in a group");

  })

  test("should return a 400 error if the user who calls the API is already in a group", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        default_user.email
      ]
    };

    await Group.create({
      name: "testing-group-2",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The user who calls the API is already in a group");

  })

  //to check if it can be done that way user with invalid email non existing one
  test("should return a 400 error if at least one of the member emails is not in a valid email format", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        "notValidEmail.com@"
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is not in a valid email format");

  })

  //to check if it can be done that way user with empty string email is non existing one
  test("should return a 400 error if at least one of the member emails is an empty string", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        ""
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is an empty string");

  })

  test("should return a 401 error if called by a user who is not authenticated (authType = Simple)", async () => {

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user = await User.create({
      username: 'filippo-user',
      email: 'filippo-user@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    const body = {
      name: "testing-group-1",
      memberEmails: [
        admin_user.email,
        default_user.email
      ]
    };

    const res = await request(app).post('/api/groups').send(body).set("Cookie", "noLoggedUser");

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual("The user is not authenticated");

  })

})

describe("getGroups", () => { 

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
  });

  test("Should return all groups", async () => {

    const to_check_groups = [
      {
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      },
      {
        name: "testing-group-2",
        members: [{email: "filippo-user-2@somedomain.com"}, {email: "filippo-user-3@somedomain.com"}],
      },
    ]

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).get('/api/groups').set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).toEqual(JSON.stringify(to_check_groups));


  })

  test("Should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {

    const to_check_groups = [
      {
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      },
      {
        name: "testing-group-2",
        members: [{email: "filippo-user-2@somedomain.com"}, {email: "filippo-user-3@somedomain.com"}],
      },
    ]

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).get('/api/groups').set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual("Unauthorized, only Admin can access Groups informations");

  })

})

describe("getGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
  });

  test("Should return requested group", async () => {

    const to_check_group ={
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).get('/api/groups/testing-group-1').set("Cookie", adminCookies);

    //expect(res.body.error).toEqual("")
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("Should return requested group when called by a user who's not admin but part of a group", async () => {

    const to_check_group ={
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      }

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
      role: 'Regular'
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

    const res = await request(app).get('/api/groups/testing-group-1').set("Cookie", userCookies);

    //expect(res.body.error).toEqual("")
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("Should return a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {

    const to_check_group ={
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      }

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
        role: 'Regular'
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

    const res = await request(app).get('/api/groups/testing-group-2').set("Cookie", adminCookies);

    //expect(res.body.error).toEqual("")
    expect(res.body.error).toEqual("Group not found");
    expect(res.status).toBe(400);

  })

  test("Should return a 401 error if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {

    const to_check_group ={
        name: "testing-group-1",
        members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
      }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          }
      ]
    });

    const res = await request(app).get('/api/groups/testing-group-1').set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual("User who is neither part of the group nor an admin");

  })

})

describe("addToGroup", () => {

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
  });

  test("should add users to the given group", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("should add users to the given group when the caller is part of the group", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user@somedomain.com"}, {email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
              email: default_user_1.email,
              user: default_user_1._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/add').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {

    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The request body does not contain all the necessary attributes");

  })

  test("should return a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/nonExistingGroup/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("Group not found");

  })

  test("should return a 400 error if all the provided emails represent users that are already in a group or do not  exist in the database", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", "nonExisting@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    await Group.create({
      name: "testing-group-2",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("All the `memberEmails` either do not exist or are already in a group");

  })

  //To be review (if i try ti create a user with empty string it should give error there but not sure if it can be like this)
  test("should return a 400 error if at least one of the member emails is not in a valid email format", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", "@wrongformat!"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is not in a valid email format");

  })

  //To be review
  test("should return a 400 error if at least one of the member emails is an empty string", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}, {email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", ""]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is an empty string");

  })

  test("should return a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user-3@somedomain.com"}, {email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
    const default_user_3 = await User.create({
      username: 'filippo-user-3',
      email: 'filippo-user-3@somedomain.com',
      password: 'password123',
      refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
      role: 'User'
  });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_3.email,
              user: default_user_3._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/add').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();

  })

  test("should retunr a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user@somedomain.com"}, {email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
              email: default_user_1.email,
              user: default_user_1._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/insert').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();

  })

 })

describe("removeFromGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
  });

  test("should remove users from the given group", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("should remove users from the given group when the caller is part of the group", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/remove').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data.group)).toEqual(JSON.stringify(to_check_group));

  })

  test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {

    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The request body does not contain all the necessary attributes");

  })

  test("should return a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).patch('/api/groups/nonExistingGroup/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("Group not found");

  })

  test("should return a 400 error if all the provided emails represent users that are already in a group or do not  exist in the database", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", "nonExisting@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });
    const default_user_2 = await User.create({
      username: 'filippo-user-2',
      email: 'filippo-user-2@somedomain.com',
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
            email: default_user_2.email,
            user: default_user_2._id
        },
      ]
    });

    await Group.create({
      name: "testing-group-2",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("All the `memberEmails` either do not exist or are not in the group");

  })

  //To be review
  test("should return a 400 error if at least one of the member emails is not in a valid email format", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", "@wrongformat!"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is not in a valid email format");

  })

  //To be review
  test("should return a 400 error if at least one of the member emails is an empty string", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-admin@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com", ""]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
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

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("At least one of the member emails is an empty string");

  })

  //also tests if admin can remove someone from group he's not in
  test("should return a 400 error if the group contains only one member before deleting any user", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [],
    }
    
    const body = {
      emails: ["filippo-user@somedomain.com"]
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          }
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The group contains only one member");

  })

  test("should return a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user-3@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
    const default_user_3 = await User.create({
      username: 'filippo-user-3',
      email: 'filippo-user-3@somedomain.com',
      password: 'password123',
      refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
      role: 'User'
  });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_3.email,
              user: default_user_3._id
          },
          {
              email: admin_user.email,
              user: admin_user._id
          },
      ]
    });

    //group for user who's calling the removal of other user from different group
    await Group.create({
      name: "testing-group-2",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          }
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/remove').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();

  })

  test("should return a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull", async () => {
    
    const to_check_group ={
      name: "testing-group-1",
      members: [{email: "filippo-user@somedomain.com"}],
    }
    
    const body = {
      emails: ["filippo-admin@somedomain.com"]
    }

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
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).patch('/api/groups/testing-group-1/pull').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();

  })


})

describe("deleteUser", () => { 

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
    await transactions.deleteMany();
  });

  test("should delete given user", async () => {
    
    const to_check_del_user ={
      deletedTransactions: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: "filippo-user@somedomain.com"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
  });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    //expect(res.body.error).toEqual("")
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).toEqual(JSON.stringify(to_check_del_user));

  })

  test("delete group when deleted user is the last in the group", async () => {
    
    const to_check_del_user ={
      deletedTransactions: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: "filippo-user@somedomain.com"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
  });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    let deleted = await Group.findOne({ name: "testing-group-1" })
    expect(deleted).toBeNull();
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body.data)).toEqual(JSON.stringify(to_check_del_user));

  })

  test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
    
    const to_check_del_user ={
      deletedTransaction: 1,
      deletedFromGroup: true
    }
    
    const body = {
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
    });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The request body does not contain all the necessary attributes");

  })

  //To review
  test("should return a 400 error if the email passed in the request body is an empty string", async () => {
    
    const to_check_del_user ={
      deletedTransaction: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: ""
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
    });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The email passed in the request body is an empty string");

  })

  //To review
  test("should return a 400 error if the email passed in the request body is not in correct email format", async () => {
    
    const to_check_del_user ={
      deletedTransaction: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: "@notGoodFormat!com"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
    });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The email passed in the request body is not in correct email format");

  })

  test("should return a 400 error if the email passed in the request body does not represent a user in the database", async () => {
    
    const to_check_del_user ={
      deletedTransaction: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: "nonExistingUser@somedomain.com"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
    });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("User not found");

  })

  test("should return 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    
    const to_check_del_user ={
      deletedTransaction: 1,
      deletedFromGroup: true
    }
    
    const body = {
      email: "filippo-user@somedomain.com"
    }

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
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const tran_1 = await transactions.create({
      username: "filippo-user",
      amount: 100,
      type: "investment",
      date: new Date("2023-06-01"),
    });

    const res = await request(app).delete('/api/users').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();

  })

})

describe("deleteGroup", () => { 

  beforeEach(async () => {
    await User.deleteMany();
    await Group.deleteMany();
    await transactions.deleteMany();
  });

  test("should delete given group", async () => {
    
    const body = {
      name: "testing-group-1"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).delete('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toEqual("Group deleted successfully");
  })

  test("should return a 400 error if the request body does not contain all the necessary attributes", async () => {
    
    const body = {
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).delete('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The request body does not contain all the necessary attributes");
  })

  test("should return a 400 error if the name passed in the request body is an empty string", async () => {
    
    const body = {
      name: ""
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).delete('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("The name passed in the request body is an empty string");
  })

  test("should return a 400 error if the name passed in the request body does not represent a group in the database", async () => {
    
    const body = {
      name: "nonExistingGroup"
    }

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
        refreshToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODU1NjUyNTQsImV4cCI6MTcxNzEwMDk3NCwiYXVkIjoicG9saXRvLml0Iiwic3ViIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwiZW1haWwiOiJmaWxpcHBvLXVzZXJAc29tZWRvbWFpbi5jb20iLCJyb2xlIjoiVXNlciIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIn0._EHJSJuDZofF0i-NgqHaEAdPXhDZ-jrNowflg-jeC-s",
        role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).delete('/api/groups').send(body).set("Cookie", adminCookies);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual("Group not found");
  })

  test("should return a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    
    const body = {
      name: "testing-group-1"
    }

    const admin_user = await User.create({
      username: 'filippo-admin',
      email: 'filippo-admin@somedomain.com',
      password: 'password123',
      refreshToken: adminRefreshToken,
      role: 'Admin'
    });
    const default_user_1 = await User.create({
      email: "filippo-user@somedomain.com",
      username: "filippo-user",
      password:"password123",
      refreshToken: userRefreshToken,
      role: "Regular"
    });
    const default_user_2 = await User.create({
      username: 'filippo-user-2',
      email: 'filippo-user-2@somedomain.com',
      password: 'password123',
      refreshToken: userRefreshToken,
      role: 'User'
    });

    await Group.create({
      name: "testing-group-1",
      members: [
          {
              email: default_user_1.email,
              user: default_user_1._id
          },
          {
            email: admin_user.email,
            user: admin_user._id
        },
      ]
    });

    const res = await request(app).delete('/api/groups').send(body).set("Cookie", userCookies);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

})