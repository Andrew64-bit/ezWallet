import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';

const adminAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzgyOTMsImV4cCI6MTcxNzYxNDMwMSwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.6yWTA63eMapfh_rhh1BLWuFyWqU_6N8j5kKB-Qgmwf0";
const adminAccessTokenNoSing = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzgyOTMsImV4cCI6MTcxNzYxNDMwMSwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.6yWTA63eMapfh_rhh1BLWuFyWqU_6N8j5kKB-Qgmwf0";
const userAccessToken = "accessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1MDksImV4cCI6MTcxNzYxNDUxMCwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.trCxraFlVYofXulZHkNhxFyeM_3JyW8Mw-_E_c7aYRI";
const userAccessTokenNoSing = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1MDksImV4cCI6MTcxNzYxNDUxMCwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.trCxraFlVYofXulZHkNhxFyeM_3JyW8Mw-_E_c7aYRI";
const adminRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg0MTAsImV4cCI6MTcxNzYxNDQxMiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.lYjWcduhkdj39MEEs1U-I1rVgl5kZ46rHizN7EQetU8";
const adminRefreshTokenNoSign = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg0MTAsImV4cCI6MTcxNzYxNDQxMiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwby5hZG1pbkBzb21lLml0IiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluIiwicm9sZSI6IkFkbWluIn0.lYjWcduhkdj39MEEs1U-I1rVgl5kZ46rHizN7EQetU8";
const userRefreshToken = "refreshToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1NTEsImV4cCI6MTcxNzYxNDU1MiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.B31B-rwRUHwq_b_3YPWmnWg6vg6cpuQpH2GWld0Z1jY";
const userRefreshTokenNoSign = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYwNzg1NTEsImV4cCI6MTcxNzYxNDU1MiwiYXVkIjoic29tZXRlc3QuY29tIiwic3ViIjoiZmlsaXBvLmFkbWluQHNvbWUuaXQiLCJlbWFpbCI6ImZpbGlwcG8tdXNlckBzb21lZG9tYWluLmNvbSIsInVzZXJuYW1lIjoiZmlsaXBwby11c2VyIiwicm9sZSI6IlVzZXIifQ.B31B-rwRUHwq_b_3YPWmnWg6vg6cpuQpH2GWld0Z1jY";

const exp_userAccessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMjg0NTMsImV4cCI6MTY4NjIyODQ1NCwiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLXVzZXIiLCJyb2xlIjoiVXNlciJ9.MzdQwbuERKu-OJ3VfjWEuFj8MRZDy0B1aSiwdhZ4DUE";
const exp_adminAccessToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMzI5NzYsImV4cCI6MTY4NjIzMjk3NiwiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby1hZG1pbi0yQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluLTIiLCJyb2xlIjoiYWRtaW4ifQ.XX9ayOwzZ618QS5jPqCW576XKtcT5pAoLwHn5d5CAwo";
const exp_adminRefreshToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMzMwMDUsImV4cCI6MTY4NjIzMzAwNiwiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby1hZG1pbi0yQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluLTIiLCJyb2xlIjoiYWRtaW4ifQ.d4s3kRtsteyZsqZ7PtPHPedVt0Ot0Ls-YRoQUOOBCqY";
const exp_userRefreshToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMjg0OTYsImV4cCI6MTY4NjIyODQ5NywiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby11c2VyQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLXVzZXIiLCJyb2xlIjoiVXNlciJ9.7oHDOwqN8p6x2So9yLrXcLECxH21k74pzf_0Z6UM0JA";
const secondAdminAccessTockenNoSign = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMzI3ODgsImV4cCI6MTcxNzc2ODc4OCwiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby1hZG1pbi0yQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluLTIiLCJyb2xlIjoiYWRtaW4ifQ.eJg_aqBwKPFcwh877YtbXjJGH_JczaSMFH7C8_Gdc2U";
const secondAdminRefreshTockenNoSign = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODYyMzI4MzYsImV4cCI6MTcxNzc2ODgzNywiYXVkIjoidGVzdC5jb20iLCJzdWIiOiJmaWxpcHBvLXVzZXJAc29tZS5pdCIsImVtYWlsIjoiZmlsaXBwby1hZG1pbi0yQHNvbWVkb21haW4uY29tIiwidXNlcm5hbWUiOiJmaWxpcHBvLWFkbWluLTIiLCJyb2xlIjoiYWRtaW4ifQ.l2r2jFl3W7L0PvCT2mUzoIhWtGAJmiGbQAWzbRC2c8A";
let adminCookies = `${adminAccessToken}; ${adminRefreshToken}`;
let userCookies = `${userAccessToken}; ${userRefreshToken}`;
describe("handleDateFilterParams", () => {
    test("Should return an empty filter object if no query parameters are provided", () => {
        const req = { query: {} };
        const filter = handleDateFilterParams(req);
        expect(filter).toEqual({});
    });
    test("Should throw an error if the query parameters include `date` together with at least one of `from` or `upTo`", () => {
        const req = { query: { date: "2023-01-01", from: "2023-01-01" } };
        expect(() => {
            handleDateFilterParams(req);
        }).toThrowError("The query parameters include `date` together with at least one of `from` or `upTo`");
    });
    test("Should throw an error if the `date` parameter is not in the format YYYY-MM-DD", () => {
        const req = { query: { date: "21-03-2023" } };
        expect(() => handleDateFilterParams(req)).toThrow()
    });
    test("Should return a filter object with the date range when only the `date` parameter is provided", () => {
        const req = { query: { date: "2023-01-01" } };
        const filter = handleDateFilterParams(req);
        expect(filter).toEqual({
            date: {
                $gte: new Date("2023-01-01T00:00:00.000Z"),
                $lte: new Date("2023-01-01T23:59:59.000Z"),
            },
        });
    });
    test("Should throw an error if the `from` parameter is not in the format YYYY-MM-DD", () => {
        const req = { query: { from: "21-03-2023" } };
        expect(() => handleDateFilterParams(req)).toThrow()
    });
    test("Should throw an error if the `upTo` (normal) parameter is not in the format YYYY-MM-DD", () => {
        const req = { query: { upTo: "21-03-2023" } }
        expect(() => handleDateFilterParams(req)).toThrow()
    });
    test("Should throw an error if the `upTo` parameter is not in the format YYYY-MM-DD", () => {
        const req = { query: { upTo: "21-03-2023", from: "2023-12-12" } };
        expect(() => handleDateFilterParams(req)).toThrow()
    });
    test("Should return a filter object with the date range when both `from` and `upTo` parameters are provided", () => {
        const req = { query: { from: "2023-01-01", upTo: "2023-01-10" } };
        const filter = handleDateFilterParams(req);
        expect(filter).toEqual({
            date: {
                $gte: new Date("2023-01-01T00:00:00.000Z"),
                $lte: new Date("2023-01-10T23:59:59.000Z"),
            },
        });
    });
    test("Should return a filter object with the date range when only the `from` parameter is provided", () => {
        const req = { query: { from: "2023-01-01" } };
        const filter = handleDateFilterParams(req);
        expect(filter).toEqual({
            date: {
                $gte: new Date("2023-01-01T00:00:00.000Z"),
            },
        });
    });
    test("Should return a filter object with the date range when only the `upTo` parameter is provided", () => {
        const req = { query: { upTo: "2023-01-10" } };
        const filter = handleDateFilterParams(req);
        expect(filter).toEqual({
            date: {
                $lte: new Date("2023-01-10T23:59:59.000Z"),
            },
        });
    });
});


describe("verifyAuth", () => {
    let req;
    let res;

    beforeEach(() => {
        req = { cookies: {} };
        res = {
            locals: {},
            cookie: jest.fn(),
        };
    });

    test("Should return unauthorized if accessToken is missing", () => {
        const info = { authType: "Simple" };
        const result = verifyAuth(req, res, info);
        expect(result).toEqual({ flag: false, cause: "Unauthorized" });
    });
    test("Should return unauthorized if refreshToken is missing", () => {
        req.cookies.accessToken = "someAccessToken";
        const info = { authType: "Simple" };
        const result = verifyAuth(req, res, info);
        expect(result).toEqual({ flag: false, cause: "Unauthorized" });
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
        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        };
        const val = verifyAuth(req, res, {authType : "Simple"});
        expect(val.flag).toEqual(false);
        expect(val.cause).toEqual("Token is missing information");

    });
    test('Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : adminAccessTokenNoSing,
                refreshToken : userAccessTokenNoSing,
            }
        }
        const res = {}
        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });
    test('Authorized', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('Token Expired --> access token refreshed', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {
            cookie: jest.fn(),
            locals: {},
        };

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : exp_userRefreshToken,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")
    });
    test('Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)

    });
    test('Other error', () => {
        const req = {
            cookies : {
                accessToken : "0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }
        const decodedAccessToken = {
            username : "ottavo",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        const val = verifyAuth(req, res, {authType : "Simple"})
        expect(val.flag).toEqual(false)

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

        const val = verifyAuth(req, res, {authType : "User"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('USER : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "User"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('USER : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : adminAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}
        const val = verifyAuth(req, res, {authType : "User", username: "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });
    test("USER : Token has a username different from the requested one", () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "User", username: "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token has a username different from the requested one")

    });
    test('USER : Authorized', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "User", username: "filippo-user"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('USER : Token Expired --> "Token has a username different from the requested one"', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }

        const val = verifyAuth(req, res, {authType : "User", username : "Anthony"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token has a username different from the requested one")

    });
    test('USER : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "User", username : "filippo-user"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('USER : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : exp_userRefreshToken,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }
        const val = verifyAuth(req, res, {authType : "User", username : "filippo-user"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });
    test('USER : Token Expired --> other', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "User", username : "filippo-user"})
        expect(val.flag).toEqual(false)

    });
    test('USER : Other error', () => {
        const req = {
            cookies : {
                accessToken : "0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg",
                refreshToken : "0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }
        const decodedAccessToken = {
            username : "ottavo",
            email : "Jhonny@gmail.com",
            role : "User"
        }

        const val = verifyAuth(req, res, {authType : "User"})
        expect(val.flag).toEqual(false)

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

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('ADMIN : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : adminAccessTokenNoSing,
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('ADMIN : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : adminAccessTokenNoSing,
                refreshToken : secondAdminRefreshTockenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });
    test("ADMIN : Admin authority needed", () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Admin authority needed")

    });
    test('ADMIN : Authorized', () => {
        const req = {
            cookies : {
                accessToken : adminAccessTokenNoSing,
                refreshToken : adminRefreshTokenNoSign,
            }
        }
        const res = {}
        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('ADMIN : Token Expired --> Admin authority needed', () => {
        const req = {
            cookies : {
                accessToken : exp_adminAccessToken,
                refreshToken : userAccessTokenNoSing,
            }
        }
        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Admin authority needed")

    });
    test('ADMIN : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : exp_adminAccessToken,
                refreshToken : adminRefreshTokenNoSign,
            }
        }
        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('ADMIN : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : exp_adminAccessToken,
                refreshToken : exp_adminRefreshToken,
            }
        }
        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });
    test('ADMIN : Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : exp_adminAccessToken,
                refreshToken : adminRefreshTokenNoSign,
            }
        }

        const res = {
            cookie : {},
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)

    });
    test('ADMIN : Other error', () => {
        const req = {
            cookies : {
                accessToken : "   ",
                refreshToken : adminRefreshTokenNoSign,
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }

        const val = verifyAuth(req, res, {authType : "Admin"})
        expect(val.flag).toEqual(false)

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

        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('GROUP : DecodedRefreshToken missing infos', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2ODQ4NzUxNzgsImV4cCI6MTcxNjQxMTI3MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoibWFyaW9yb3NzaUBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6Ik1hcmlvIiwiU3VybmFtZSI6IlJvc3NpIiwiRW1haWwiOiJtYXJpb3Jvc3NpQGV4YW1wbGUuY29tIiwiUm9sZSI6IlVzZXIifQ.1dsCt5harR4rzikBS-Nkq9Y59cvOgJMgLsNLnCsPcbg"
            }
        }
        const res = {}
        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Token is missing information")

    });
    test('GROUP : Mismatched users', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : adminRefreshTokenNoSign,
            }
        }
        const val = verifyAuth(req, res, {authType : "Group"})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Mismatched users")

    });
    test("GROUP : User is not in the group", () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}
        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "rr@gmail.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("User is not in the group")

    });
    test('GROUP : Authorized', () => {
        const req = {
            cookies : {
                accessToken : userAccessTokenNoSing,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {}

        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "filippo-user@somedomain.com"]})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('GROUP : Token Expired --> User is not in the group', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userAccessTokenNoSing,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }
        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "filippo@somedomain.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("User is not in the group")

    });
    test('GROUP : Token Expired --> Authorized', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userAccessTokenNoSing,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }
        const val = verifyAuth(req, res, {authType : "Group", emails : ["Anthony@gmail.com", "filippo-user@somedomain.com"]})
        expect(val.flag).toEqual(true)
        expect(val.cause).toEqual("Authorized")

    });
    test('GROUP : Token Expired --> perform login again', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : exp_userRefreshToken,
            }
        }
        const res = {
            cookie : jest.fn(),
            locals : {}
        }
        const val = verifyAuth(req, res, {authType : "Group", emails : ["filippo-user@somedomain.com"]})
        expect(val.flag).toEqual(false)
        expect(val.cause).toEqual("Perform login again")

    });
    test('GROUP : Token Expired --> other error', () => {
        const req = {
            cookies : {
                accessToken : exp_userAccessToken,
                refreshToken : userRefreshTokenNoSign,
            }
        }
        const res = {
            cookie : {},
            locals : {}
        }
        const val = verifyAuth(req, res, {authType : "Group", emails : ["filippo-user@somedomain.com"]})
        expect(val.flag).toEqual(false)

    });
    test('GROUP : Other error', () => {
        const req = {
            cookies : {
                accessToken : "sasdas",
                refreshToken : "sdadsdas",
            }
        }
        const val = verifyAuth(req, res, {authType : "Group", emails : ["Jhonny@gmail.com"]})
        expect(val.flag).toEqual(false)

    });
})

describe("handleAmountFilterParams", () => {
    test("The Min value must be a numerical value", () => {
        const req = {
            query : {
                min : "a"
            }
        }
        expect(() => handleAmountFilterParams(req)).toThrow()
    });
    test("The Max value must be a numerical value", () => {
        const req = {
            query : {
                min : 123,
                max : "abc"
            }
        }
        expect(() => handleAmountFilterParams(req)).toThrow()
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
        const req = { query: { max: "b" } }
        const expected = {amount : {$gte: req.query.min, $lte : req.query.max} }
        expect(() => handleAmountFilterParams(req)).toThrow()
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
});

