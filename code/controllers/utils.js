import jwt from 'jsonwebtoken'
require('dotenv').config();

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 */
export const handleDateFilterParams = (req) => {
    
    //Check inclusion of 'date' together with at least one of `from` or `upTo`
    if(req.query && req.query.date && (req.query.from || req.query.upTo))
    {
        throw new Error("The query parameters include `date` together with at least one of `from` or `upTo`");
    }

    var regEx = /^\d{4}-\d{2}-\d{2}$/;

    //Case date (Q: date format considered correct (?))
    if(req.query.date)
    {
        //Check on format
        let timestamp = Date.parse(req.query.date);
        if (isNaN(timestamp)) {
            throw new Error("Not a string that represents a date in the format **YYYY-MM-DD**");
        }
        //if(!req.query.date.match(regEx)) throw new Error("Not a string that represents a date in the format **YYYY-MM-DD**");
        const from = new Date(req.query.date + "T00:00:00.000Z")
        const upTo = new Date(req.query.date + "T23:59:59.000Z")
        const filter = { date : {$gte: from , $lte : upTo}}
        return filter;
    }


    if(req.query.from)
    {
        //Check on format
        let timestamp = Date.parse(req.query.from);
        if (isNaN(timestamp)) {
            throw new Error("Not a string that represents a date in the format **YYYY-MM-DD**");
        }

        if(req.query.upTo)
        {
            //Case date from and upTo

            //Check on format
            //Check on format
            let timestamp = Date.parse(req.query.upTo);
            if (isNaN(timestamp)) {
                throw new Error("Not a string that represents a date in the format **YYYY-MM-DD**");
            }
            const from = new Date(req.query.from + "T00:00:00.000Z")
            const upTo = new Date(req.query.upTo + "T23:59:59.000Z")
            return { date : {$gte: from, $lte : upTo}};
        }
        else
        {
            //Case date from only
            const date = new Date(req.query.from + "T00:00:00.000Z")
            return { date : {$gte: date }}
        }
    }
    else
    {
        if(req.query.upTo)
        {
            //Case date upTo only

            //Check on format
            //Check on format
            let timestamp = Date.parse(req.query.upTo);
            if (isNaN(timestamp)) {
                throw new Error("Not a string that represents a date in the format **YYYY-MM-DD**");
            }
            const upTo = new Date(req.query.upTo + "T23:59:59.000Z")
            return {date : {$lte : upTo}};
        }
    }
    //Empty filter case
    return {};
}

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin 
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group 
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group 
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 */
export const verifyAuth = (req, res, info) => {
    const cookie = req.cookies

    //not logged-in
    if (!cookie.accessToken) {
        return {flag: false, cause: "Unauthorized"};
    }
    //not logged-in
    if (!cookie.refreshToken) {
        return {flag: false, cause: "Unauthorized"};
    }

    const authType = info.authType;

    switch(authType)
    {
        case "Simple" :
            try {
                //Decode of the tokens
                const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
                const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

                //Check of the two tokens validity + matching of two tokens user
                if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                
                if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
                    return {flag: false, cause: "Mismatched users"};
                }
                //Authorized user (it's logged in)
                return { flag : true, cause: "Authorized" }
            } 
            catch (err) 
            {
                if (err.name === "TokenExpiredError") 
                {
                    try {
                        const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                        const newAccessToken = jwt.sign({
                            username: refreshToken.username,
                            email: refreshToken.email,
                            id: refreshToken.id,
                            role: refreshToken.role
                        }, process.env.ACCESS_KEY, { expiresIn: '1h' })

                        res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                        res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls';
                        return {flag: true, cause: "Authorized"}
                    } 
                    catch (err) 
                    {
                        if (err.name === "TokenExpiredError") {
                            return { flag: false, cause: "Perform login again" }
                        } else {
                            return { flag: false, cause: err.name }
                        }
                    }
                } else {
                    return { flag: false, cause: err.name };
                }
            }

        case "User":
            try {
                //Decode of the tokens
                const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
                const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

                //Check of the two tokens validity + matching of two tokens user
                if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
                    return {flag: false, cause: "Mismatched users"};
                }

                //Check if the token username is equal to the username requested
                if(decodedAccessToken.username != info.username)
                {
                    return {flag: false, cause: "Token has a username different from the requested one"};
                }

                //Authorized
                return {flag: true, cause: "Authorized"}

            } 
            catch (err) 
            {
                if (err.name === "TokenExpiredError") 
                {
                    try {
                        const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)
                        //Check equality of requested username and refreshToken username
                        if(refreshToken.username != info.username)
                        {
                            return {flag: false, cause: "Token has a username different from the requested one"};
                        }

                        const newAccessToken = jwt.sign({
                            username: refreshToken.username,
                            email: refreshToken.email,
                            id: refreshToken.id,
                            role: refreshToken.role
                        }, process.env.ACCESS_KEY, { expiresIn: '1h' })

                        res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                        res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls';
                        //Authorized and token refreshed
                        return {flag: true, cause: "Authorized"}
                    } 
                    catch (err) 
                    {
                        if (err.name === "TokenExpiredError") {
                            return { flag: false, cause: "Perform login again" }
                        } else {
                            return { flag: false, cause: err.name }

                        }
                    }
                } else {
                    return { flag: false, cause: err.name };
                }
            }
     
        case "Admin" :
            try {
                //Decode of the tokens
                const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
                const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

                //Check of the two tokens validity + matching of two tokens user
                if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
                    return {flag: false, cause: "Mismatched users"};
                }

                //Check if it's an admin
                if(decodedAccessToken.role != "Admin")
                {
                    return {flag: false, cause: "Admin authority needed"};
                }

                //Authorized
                return {flag: true, cause: "Authorized"}
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    try {
                        const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)

                        //Check if it's an admin
                        if(refreshToken.role != "Admin")
                        {
                            return {flag: false, cause: "Admin authority needed"};
                        }
                        const newAccessToken = jwt.sign({
                            username: refreshToken.username,
                            email: refreshToken.email,
                            id: refreshToken.id,
                            role: refreshToken.role
                        }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                        res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                        res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'

                        //Authorized
                        return {flag: true, cause: "Authorized"}

                    } catch (err) {
                        if (err.name === "TokenExpiredError") {
                            return { flag: false, cause: "Perform login again" }
                        } else {
                            return { flag: false, cause: err.name }
                        }
                    }
                } else {
                    return { flag: false, cause: err.name }
                }
            }

        case "Group" :
            try {
                //Decode of the tokens
                const decodedAccessToken = jwt.verify(cookie.accessToken, process.env.ACCESS_KEY);
                const decodedRefreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY);

                //Check of the two tokens validity + matching of two tokens user
                if (!decodedAccessToken.username || !decodedAccessToken.email || !decodedAccessToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (!decodedRefreshToken.username || !decodedRefreshToken.email || !decodedRefreshToken.role) 
                {
                    return {flag: false, cause: "Token is missing information"};
                }
                if (decodedAccessToken.username !== decodedRefreshToken.username || decodedAccessToken.email !== decodedRefreshToken.email || decodedAccessToken.role !== decodedRefreshToken.role) {
                    return {flag: false, cause: "Mismatched users"};
                }

                //Check if user is contained inside group
                if(!info.emails.includes(decodedAccessToken.email))
                {
                    return {flag: false, cause: "User is not in the group"};
                }

                //Authorized
                return {flag: true, cause: "Authorized"}
            } catch (err) {
                if (err.name === "TokenExpiredError") {
                    try {
                        const refreshToken = jwt.verify(cookie.refreshToken, process.env.ACCESS_KEY)

                        //Check if user is contained inside group
                        if(!info.emails.includes(refreshToken.email))
                        {
                            return {flag: false, cause: "User is not in the group"};
                        }

                        const newAccessToken = jwt.sign({
                            username: refreshToken.username,
                            email: refreshToken.email,
                            id: refreshToken.id,
                            role: refreshToken.role
                        }, process.env.ACCESS_KEY, { expiresIn: '1h' })
                        res.cookie('accessToken', newAccessToken, { httpOnly: true, path: '/api', maxAge: 60 * 60 * 1000, sameSite: 'none', secure: true })
                        res.locals.refreshedTokenMessage = 'Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls'

                        //Authorized
                        return {flag: true, cause: "Authorized"}

                    } catch (err) {
                        if (err.name === "TokenExpiredError") {
                            return { flag: false, cause: "Perform login again" }
                        } else {
                            return { flag: false, cause: err.name }
                        }
                    }
                } else {
                    return { flag: false, cause: err.name }
                }
            }
    }
}

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 */
export const handleAmountFilterParams = (req) => {

    if(req.query.min)
    {
        //check if Min is a numerical value
        if(isNaN(req.query.min))
        {
            throw new Error("The Min value must be a numerical value");
        }

        if(req.query.max)
        {
            //check if Min is a numerical value
            if(isNaN(req.query.max))
            {
                throw new Error("The Max value must be a numerical value");
            }
            
            //Case Min and Max
            return {amount : {$gte: req.query.min, $lte : req.query.max} };
        }
        //Case Min only
        return { amount : {$gte : req.query.min}};
    }
    else
    {
        if(req.query.max)
        {
            //check if Min is a numerical value
            if(isNaN(req.query.max))
            {
                throw new Error("The Max value must be a numerical value");
            }
            //Case Max only
            return { amount : {$lte: req.query.max}};
        }
    }
    return {amount: {}};
}