import { handleDateFilterParams,
    handleAmountFilterParams,
    verifyAuth,} from "../controllers/utils.js";
import jwt from 'jsonwebtoken'
import {categories, transactions} from "../models/model.js";
import {Group, User} from "../models/User.js";

jest.mock("../models/User.js")
jest.mock("../models/model.js")


jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign : jest.fn()
}))
beforeEach(() => {
    categories.find.mockClear();
    categories.prototype.save.mockClear();
    transactions.find.mockClear();
    transactions.deleteOne.mockClear();
    transactions.aggregate.mockClear();
    transactions.prototype.save.mockClear();
    Group.find.mockClear();
    Group.findOne.mockClear();
    User.find.mockClear();
    User.findOne.mockClear();
    jwt.verify.mockClear();
    jwt.sign.mockClear();


});
describe("handleDateFilterParams", () => { 
    test("The query parameters include `date` together with at least one of `from` or `upTo`", async () => {

        const mockReq = {
            query : {
                from : "2023-04-30",
                upTo : "2023-06-10",
                date : "2023-06-10"
            }
        }

        expect(function() {
            handleDateFilterParams(mockReq);
        }).toThrow("The query parameters include `date` together with at least one of `from` or `upTo`")
    });

    test("Not a string that represents a date in the format **YYYY-MM-DD**", async () => {

        const mockReq = {
            query : {
                date : "2023-04-30-01"
            }
        }
        /*
                const expectedFilter = {
                    $gte : new Date("2023-04-30T00:00:00.000Z"),
                    $lte : new Date("2023-06-10T23:59:59.000Z")
                }
         */

        expect(() => { handleDateFilterParams(mockReq) }).toThrow("Not a string that represents a date in the format **YYYY-MM-DD**")
    });

    test("Case date", async () => {

        const mockReq = {
            query : {
                date : "2023-04-30"
            }
        }
        /*
                const expectedFilter = {
                    $gte : new Date("2023-04-30T00:00:00.000Z"),
                    $lte : new Date("2023-06-10T23:59:59.000Z")
                }
         */

        const filter = handleDateFilterParams(mockReq)
        const expected = { date : {$gte: new Date("2023-04-30T00:00:00.000Z") , $lte : new Date("2023-04-30T23:59:59.000Z")}}
        expect(filter.date).toEqual(expected.date)
    });

    test("Not a string that represents a date in the format **YYYY-MM-DD**", async () => {

        const mockReq = {
            query : {
                from : "2023-04-30-01",
                upTo: "2023-05-30"
            }
        }

        //const filter = handleDateFilterParams(mockReq)
        //const expected = { date : {$gte: new Date("2023-04-30T00:00:00.000Z") , $lte : new Date("2023-05-30T23:59:59.000Z")}}
        expect(() => handleDateFilterParams(mockReq)).toThrow("Not a string that represents a date in the format **YYYY-MM-DD**")
    });

    test("Not a string that represents a date in the format **YYYY-MM-DD**", async () => {

        const mockReq = {
            query : {
                from : "2023-04-30",
                upTo: "2023-05-30-01"
            }
        }

        //const filter = handleDateFilterParams(mockReq)
        //const expected = { date : {$gte: new Date("2023-04-30T00:00:00.000Z") , $lte : new Date("2023-05-30T23:59:59.000Z")}}
        expect(() => handleDateFilterParams(mockReq)).toThrow("Not a string that represents a date in the format **YYYY-MM-DD**")
    });


    test("Case From and upTo", async () => {

        const mockReq = {
            query : {
                from : "2023-04-30",
                upTo: "2023-05-30"
            }
        }

        const filter = handleDateFilterParams(mockReq)
        const expected = { date : {$gte: new Date("2023-04-30T00:00:00.000Z") , $lte : new Date("2023-05-30T23:59:59.000Z")}}
        expect(filter.date).toEqual(expected.date)
    });

    test("Case From only", async () => {

        const mockReq = {
            query : {
                from : "2023-04-30"
            }
        }

        const filter = handleDateFilterParams(mockReq)
        const expected = { date : {$gte: new Date("2023-04-30T00:00:00.000Z")}}
        expect(filter.date).toEqual(expected.date)
    });

    test("Case upTo only", async () => {

        const mockReq = {
            query : {
                upTo : "2023-04-30"
            }
        }

        const filter = handleDateFilterParams(mockReq)
        const expected = { date : {$lte: new Date("2023-04-30T23:59:59.000Z")}}
        expect(filter.date).toEqual(expected.date)
    });

    test("Case upTo not valid string that represents a date in the format **YYYY-MM-DD**", async () => {

        const mockReq = {
            query : {
                upTo : "2023-04-30-01"
            }
        }

        expect(() => handleDateFilterParams(mockReq)).toThrow("Not a string that represents a date in the format **YYYY-MM-DD**")
    });

    test("Empty", async () => {

        const mockReq = {
            query : {
            }
        }

        const filter = handleDateFilterParams(mockReq)
        const expected = { }
        expect(filter).toEqual(expected)
    });

})

describe("verifyAuth", () => { 
    test('Access token not passed', () => {
        const req = {
            cookies : {
                //accessToken : "",
                refreshToken : ""
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Unauthorized")

    });

    test('Refresh token not passed', () => {
        const req = {
            cookies : {
                accessToken : "true",
                //refreshToken : ""
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Unauthorized")

    });

    //Simple cases
    test('DecodedAccessToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "primo",
            email : "",
            role : ""
        }
        const decodedRefreshToken = {
            username : "primo",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "secondo",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "terzo",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Anthony",
            email : "Anthony@gmail.com",
            role : "Admin"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });

    test('Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('Token Expired --> access token refreshed', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "quinto",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken)


        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "sesto",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "sesto",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });

    test('Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "settimo",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "settimo",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });

    test('Other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "ottavo",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "ottavo",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });


    //User cases
    test('USER : DecodedAccessToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "",
            email : "",
            role : ""
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('USER : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('USER : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Dhon",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User", username: "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });

    test("USER : Token has a username different from the requested one", () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User", username: "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token has a username different from the requested one")

    });

    test('USER : Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User", username: "Jhonny"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('USER : Token Expired --> "Token has a username different from the requested one"', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "User", username : "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token has a username different from the requested one")

    });

    test('USER : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken)


        const val = verifyAuth(req, res, {authType : "User", username : "Jhonny"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('USER : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        const val = verifyAuth(req, res, {authType : "User", username : "Jhonny"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });

    test('USER : Token Expired --> other', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "other";
            throw e;
        })

        const val = verifyAuth(req, res, {authType : "User", username : "Jhonny"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("other")

    });

    test('USER : Other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })

        const val = verifyAuth(req, res, {authType : "User", username : "Jhonny"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });

    //Admin cases
    test('ADMIN : DecodedAccessToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "",
            email : "",
            role : ""
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('ADMIN : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('ADMIN : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Anthony",
            email : "Anthony@gmail.com",
            role : "Admin"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });

    test("ADMIN : Admin authority needed", () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Admin authority needed")

    });

    test('ADMIN : Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('ADMIN : Token Expired --> Admin authority needed', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)


        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Admin authority needed")

    });

    test('ADMIN : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken)


        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('ADMIN : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });

    test('ADMIN : Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });

    test('ADMIN : Other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });

    //Group cases
    test('GROUP : DecodedAccessToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "",
            email : "",
            role : ""
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('GROUP : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "",
            email : "",
            role : ""
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });

    test('GROUP : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Anthony",
            email : "Anthony@gmail.com",
            role : "Admin"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });

    test("GROUP : User is not in the group", () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "rr@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("User is not in the group")

    });

    test('GROUP : Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedAccessToken)
        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)

        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "Jhonny@gmail.com"]})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('GROUP : Token Expired --> User is not in the group', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        //jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken)


        const val = verifyAuth(req, res, {authType : "Group", emails : ["anthony@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("User is not in the group")

    });

    test('GROUP : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockReturnValueOnce(decodedAccessToken)


        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "Jhonny@gmail.com"]})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });

    test('GROUP : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Group", emails : ["Jhonny@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });

    test('GROUP : Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "Admin",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "TokenExpiredError";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Group", emails : ["Jhonny@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });

    test('GROUP : Other error', () => {
        const req = {
            cookies : {
                accessToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : jest.fn().mockImplementationOnce(() => {}),
            locals : {
                refreshedTokenMessage : ""
            }
        }
        const decodedAccessToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User"
        }
        const decodedRefreshToken = {
            username : "Jhonny",
            email : "Jhonny@gmail.com",
            role : "User",
            id : 1234
        }

        jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })

        jest.spyOn(jwt, "verify").mockReturnValueOnce(decodedRefreshToken)
        jest.spyOn(jwt, "sign").mockImplementationOnce(() => {
            const e = new Error("Token Expired");
            e.name = "Other Error";
            throw e;
        })


        const val = verifyAuth(req, res, {authType : "Group", emails : ["Jhonny@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Other Error")

    });
})

describe("handleAmountFilterParams", () => { 
    test("The Min value must be a numerical value", () => {
        const req = {
            query : {
                min : "a"
            }
        }
        expect(() => {handleAmountFilterParams(req)}).toThrow("The Min value must be a numerical value");
    });

    test("The Max value must be a numerical value", () => {
        const req = {
            query : {
                min : 123,
                max : "a"
            }
        }
        expect(() => {handleAmountFilterParams(req)}).toThrow("The Max value must be a numerical value");
    });

    test("Case Min and Max", () => {
        const req = {
            query : {
                min : 123,
                max : 133
            }
        }
        const expected = {amount : {$gte: req.query.min, $lte : req.query.max} }
        const filter = handleAmountFilterParams(req)
        expect(filter).toEqual(expected);
    });

    test("Case Min only", () => {
        const req = {
            query : {
                min : 123
            }
        }
        const expected = {amount : {$gte: req.query.min} }
        const filter = handleAmountFilterParams(req)
        expect(filter).toEqual(expected);
    });

    test("The Max value must be a numerical value (when only Max)", () => {
        const req = {
            query : {
                max : "a"
            }
        }
        const expected = {amount : {$gte: req.query.min, $lte : req.query.max} }
        expect(() => handleAmountFilterParams(req)).toThrow("The Max value must be a numerical value");
    });

    test("Case Max only", () => {
        const req = {
            query : {
                max : 133
            }
        }
        const expected = {amount : { $lte : req.query.max} }
        const filter = handleAmountFilterParams(req)
        expect(filter).toEqual(expected);
    });

    test("Case Empty", () => {
        const req = {
            query : {
            }
        }
        const expected = {amount: {} }
        const filter = handleAmountFilterParams(req)
        expect(filter).toEqual(expected);
    });


})
