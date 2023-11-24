import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';
import {
    adminAccessTokenValid, adminRefreshTokenValid,
    testerAccessTokenValid, testerRefreshTokenValid,
    emptyAccessToken, emptyRefreshToken,
    adminAccessTokenExpired, adminRefreshTokenExpired
} from './tokens';

describe("1: handleDateFilterParams", () => {
    test(`T1.1: Returns an object with a property "date" having as value an object with properties "$gte" and "$lte", with these properties both referring to the specified date, if only "date" is specified`, () => {
        const req = { query: { date: "2023-04-21" } }
        const res = handleDateFilterParams(req)
        expect(res).toHaveProperty("date")
        expect(res.date).toHaveProperty("$gte")
        expect(res.date).toHaveProperty("$lte")
        expect(res.date.$gte.toISOString().slice(0, 19)).toEqual(req.query.date.slice(0, 10) + "T00:00:00")
        expect(res.date.$lte.toISOString().slice(0, 19)).toEqual(req.query.date.slice(0, 10) + "T23:59:59")
    })

    test(`T1.2: Returns an object with a property "date" having as value an object with property "$gte" that refers to the specified date if only "from" is present`, () => {
        const req = { query: { from: "2023-04-21" } }
        const res = handleDateFilterParams(req)
        expect(res).toHaveProperty("date")
        expect(res.date).toHaveProperty("$gte")
        expect(res.date.$gte.toISOString().slice(0, 19)).toEqual(req.query.from.slice(0, 10) + "T00:00:00")
    })

    test(`T1.3: Returns an object with a property "date" having as value an object with property "$lte" that refers to the specified date if only "upTo" is present`, () => {
        const req = { query: { upTo: "2023-04-21" } }
        const res = handleDateFilterParams(req)
        expect(res).toHaveProperty("date")
        expect(res.date).toHaveProperty("$lte")
        expect(res.date.$lte.toISOString().slice(0, 19)).toEqual(req.query.upTo.slice(0, 10) + "T23:59:59")
    })

    test(`T1.4: Returns an object with a property "date" having as value an object with properties "$gte" and "$lte", with these properties referring to "from" and "upTo", if they are both specified`, () => {
        const req = { query: { from: "2023-04-21", upTo: "2023-04-22" } }
        const res = handleDateFilterParams(req)
        expect(res).toHaveProperty("date")
        expect(res.date).toHaveProperty("$gte")
        expect(res.date).toHaveProperty("$lte")
        expect(res.date.$gte.toISOString().slice(0, 19)).toEqual(req.query.from.slice(0, 10) + "T00:00:00")
        expect(res.date.$lte.toISOString().slice(0, 19)).toEqual(req.query.upTo.slice(0, 10) + "T23:59:59")
    })

    test(`T1.5: Returns an empty object if there are no query parameters`, () => {
        const req = {
            query: {}
        }
        const res = handleDateFilterParams(req)
        expect(res).toMatchObject({} || { date: {} })
    })

    test(`T1.6 Throws an error if "date" is specified together with at least one of "from" or "upTo"`, () => {
        const req1 = { query: { from: "2023-04-22", date: "2023-04-21" } }
        const req2 = { query: { upTo: "2023-04-22", date: "2023-04-21" } }
        const req3 = { query: { from: "2023-04-22", upTo: "2023-04-23", date: "2023-04-21" } }
        expect(() => handleDateFilterParams(req1)).toThrow()
        expect(() => handleDateFilterParams(req2)).toThrow()
        expect(() => handleDateFilterParams(req3)).toThrow()
    })

    test(`T1.7: Throws an error if at least one of the query parameters is not a date in the format "YYYY-MM-DD"`, () => {
        const req1 = { query: { from: "2023-13-21" } }
        const req2 = { query: { upTo: "2023-13-21" } }
        const req3 = { query: { date: "2023-13-21" } }
        const req4 = { query: { date: "21-03-2023" } }
        const req5 = { query: { from: "21-03-2023" } }
        const req6 = { query: { upTo: "21-03-2023" } }
        expect(() => handleDateFilterParams(req1)).toThrow()
        expect(() => handleDateFilterParams(req2)).toThrow()
        expect(() => handleDateFilterParams(req3)).toThrow()
        expect(() => handleDateFilterParams(req4)).toThrow()
        expect(() => handleDateFilterParams(req5)).toThrow()
        expect(() => handleDateFilterParams(req6)).toThrow()
    })

})

describe("2: verifyAuth", () => {
    describe("2.1: Simple authentication criteria", () => {
        test("T2.1.1: Undefined tokens", () => {
            const req = { cookies: {} }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.2: Access token with no information", () => {
            const req = { cookies: { accessToken: emptyAccessToken, refreshToken: adminRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.3: Refresh token with no information", () => {
            const req = { cookies: { accessToken: adminAccessTokenValid, refreshToken: emptyRefreshToken } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.4: Access token and refresh token belonging to different users", () => {
            const req = { cookies: { accessToken: adminAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.5: Acccess token and refresh token are both valid", () => {
            const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("T2.1.6: Access token expired and valid refresh token", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: adminRefreshTokenValid } }
            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(true)).toBe(true)
            expect(res.cookieArgs).toEqual({
                name: 'accessToken',
                value: expect.any(String),
                options: {
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
        })

        test("T2.1.7: Access token and refresh token are both expired", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: adminRefreshTokenExpired } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.8: Access token expired and invalid refresh token", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: "invalidRefreshToken" } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.1.9: Access token and refresh token are both invalid", () => {
            const req = { cookies: { accessToken: "invalidAccessToken", refreshToken: "invalidRefreshToken" } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Simple" })
            expect(Object.values(response).includes(false)).toBe(true)
        })
    })

    describe("2.2: User authentication criteria", () => {
        test("T2.2.1: Tokens don't belong to the requested user", () => {
            const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "User", username: "admin" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.2.2: Tokens are both valid and belong to the requested user", () => {
            const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "User", username: "tester" })
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("T2.2.3: Access token expired and refresh token not belonging to the requested user", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "User", username: "admin" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.2.4: Access token expired and refresh token belonging to the requested user", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: adminRefreshTokenValid } }
            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "User", username: "admin" })
            expect(Object.values(response).includes(true)).toBe(true)
            expect(res.cookieArgs).toEqual({
                name: 'accessToken',
                value: expect.any(String),
                options: {
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
        })
    })

    describe("2.3: Admin authentication criteria", () => {
        test("T2.3.1: Tokens don't belong to an admin", () => {
            const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Admin" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.3.2: Tokens are both valid and belong to an admin", () => {
            const req = { cookies: { accessToken: adminAccessTokenValid, refreshToken: adminRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Admin" })
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("T2.3.3: Access token expired and refresh token not belonging to an admin", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Admin" })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.3.4: Access token expired and refresh token belonging to an admin", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: adminRefreshTokenValid } }
            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Admin" })
            expect(Object.values(response).includes(true)).toBe(true)
            expect(res.cookieArgs).toEqual({
                name: 'accessToken',
                value: expect.any(String),
                options: {
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
        })
    })

    describe("2.4: Group authentication criteria", () => {
        test("T2.4.1: Tokens don't belong to a member of the group", () => {
            const req = { cookies: { accessToken: testerAccessTokenValid, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com"], memberEmails: ["admin@email.com"], members: ["admin@email.com"] })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.4.2: Tokens are both valid and belong to a member of the group", () => {
            const req = { cookies: { accessToken: adminAccessTokenValid, refreshToken: adminRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com"], memberEmails: ["admin@email.com"], members: ["admin@email.com"] })
            expect(Object.values(response).includes(true)).toBe(true)
        })

        test("T2.4.3: Access token expired and refresh token not belonging to a member of the group", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: testerRefreshTokenValid } }
            const res = {}
            const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com"], memberEmails: ["admin@email.com"], members: ["admin@email.com"] })
            expect(Object.values(response).includes(false)).toBe(true)
        })

        test("T2.4.4: Access token expired and refresh token belonging to a member of the group", () => {
            const req = { cookies: { accessToken: adminAccessTokenExpired, refreshToken: adminRefreshTokenValid } }
            const cookieMock = (name, value, options) => {
                res.cookieArgs = { name, value, options };
            }
            const res = {
                cookie: cookieMock,
                locals: {},
            }
            const response = verifyAuth(req, res, { authType: "Group", emails: ["admin@email.com"], memberEmails: ["admin@email.com"], members: ["admin@email.com"] })
            expect(Object.values(response).includes(true)).toBe(true)
            expect(res.cookieArgs).toEqual({
                name: 'accessToken',
                value: expect.any(String),
                options: {
                    httpOnly: true,
                    path: '/api',
                    maxAge: 60 * 60 * 1000,
                    sameSite: 'none',
                    secure: true,
                },
            })
        })
    })
})

describe("3: handleAmountFilterParams", () => {
    test(`T3.1: Returns an empty object if neither "min" nor "max" are specified`, () => {
        const req = { query: {} }
        const res = handleAmountFilterParams(req)
        expect(res).toMatchObject({} || { amount: {} })
    })

    test(`T3.2: Returns an object with a property named "amount" having as value an object with a property named "$lte" and value equal to "max" if only "max" is specified`, () => {
        const req = { query: { max: 100 } }
        const res = handleAmountFilterParams(req)
        expect(res).toHaveProperty("amount")
        expect(res.amount).toEqual({ $lte: 100 })
    })

    test(`T3.3: Returns an object with a property named "amount" having as value an object with a property "$gte" and value equal to "min" if only "min" is specified`, () => {
        const req = { query: { min: 10 } }
        const res = handleAmountFilterParams(req)
        expect(res).toHaveProperty("amount")
        expect(res.amount).toEqual({ $gte: 10 })
    })

    test(`T3.4: Returns an object with a property named "amount" having as value an object with both "$gte" and "$lte" properties and values equal to "min" and "max" respectively if both "min" and "max" are specified`, () => {
        const req = { query: { min: 10, max: 100 } }
        const res = handleAmountFilterParams(req)
        expect(res).toHaveProperty("amount")
        expect(res.amount).toEqual({ $gte: 10, $lte: 100 })
    })

    test("T3.5: Throws an error if at least one of the query parameters cannot be parsed as a number", () => {
        const req1 = { query: { min: "a", max: "b" } }
        const req2 = { query: { min: "a", } }
        const req3 = { query: { max: "b" } }
        expect(() => handleAmountFilterParams(req1)).toThrow()
        expect(() => handleAmountFilterParams(req2)).toThrow()
        expect(() => handleAmountFilterParams(req3)).toThrow()
    })

})