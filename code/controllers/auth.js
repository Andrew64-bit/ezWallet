import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { verifyAuth } from "./utils.js";
require("dotenv").config();


/**
 * Register a new user in the system
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
   • Returns a 400 error if the request body does not contain all the necessary attributes
   • Returns a 400 error if at least one of the parameters in the request body is an empty string
   • Returns a 400 error if the email in the request body is not in a valid email format
   • Returns a 400 error if the username in the request body identifies an already existing user
   • Returns a 400 error if the email in the request body identifies an already existing user
 */
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //Check on attributes of request body if empty string
    if(username === "" || email === "" || password === "")
    {
      throw new Error("At least one of the parameters in the request body is an empty string");
    }

    //Check on attributes of request body
    if(!username || !email || !password)
    {
      return res.status(400).json({error: "The request body does not contain all the necessary attributes"});
    }



    //check email format
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    if(!email.match(regexExp))
    {
      return res.status(400).json({error: "The email in the request body is not in a valid email format" })
    }

    //check for existing username
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({error: "The user in the request body identifies an already existing user"});
    }

    //check for existing email
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({error: "The email in the request body identifies an already existing user"});
    }

    //Checks passed, insertion of the user
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: "Regular",
    });

    return res.status(200).json({data: {message : "User added successfully"}});
  } catch (err) {
    err.name = ""
    return res.status(400).json({ error: err.toString() });
  }
};

/**
 * Register a new user in the system with an Admin role
  - Request Body Content: An object having attributes `username`, `email` and `password`
  - Response `data` Content: A message confirming successful insertion
  - Optional behavior:
    • Returns a 400 error if the request body does not contain all the necessary attributes
    • Returns a 400 error if at least one of the parameters in the request body is an empty string
    • Returns a 400 error if the email in the request body is not in a valid email format
    • Returns a 400 error if the username in the request body identifies an already existing user
    • Returns a 400 error if the email in the request body identifies an already existing user
 */
export const registerAdmin = async (req, res) => {
  try {

    const { username, email, password } = req.body;

    //Check on attributes of request body if empty string
    if(username === "" || email === "" || password === "")
    {
      throw new Error("At least one of the parameters in the request body is an empty string");
    }

    //Check on attributes of request body
    if(!username || !email || !password)
    {
      return res.status(400).json({error: "The request body does not contain all the necessary attributes"});
    }

    //check email format
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    if(!email.match(regexExp))
    {
      return res.status(400).json({error: "The email in the request body is not in a valid email format" })
    }

    //check for existing username
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({error: "The user in the request body identifies an already existing user"});
    }

    //check for existing email
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({error: "The email in the request body identifies an already existing user"});
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "Admin",
    });
    return res.status(200).json({data: {message : "Admin added successfully"}});
  } catch (err) {
    err.name = ""
    return res.status(400).json({ error: err.toString() });
  }
};

/**
 * Perform login 
  - Request Body Content: An object having attributes `email` and `password`
  - Response `data` Content: An object with the created accessToken and refreshToken
  - Optional behavior:
    • Returns a 400 error if the request body does not contain all the necessary attributes
    • Returns a 400 error if at least one of the parameters in the request body is an empty string
    • Returns a 400 error if the email in the request body is not in a valid email format
    • Returns a 400 error if the email in the request body does not identify a user in the database
    • Returns a 400 error if the supplied password does not match with the one in the database
 **/
export const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    //Check on attributes of request body if empty string
    if(email === "" || password === "") {
      return res.status(400).json({error: "At least one of the parameters in the request body is an empty string"});
    }

    //Check on attributes of request body
    if(!email || !password) {
      throw new Error("The request body does not contain all the necessary attributes");
    }

    //check email format
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    if(!email.match(regexExp))
    {
      return res.status(400).json({error: "The email in the request body is not in a valid email format" })
    }

    //check for existing email
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(400).json({error: "The user in the request body does not identify a user in the database"});
    }

    const match = await bcrypt.compare(password, existingUser.password)
    if (!match)
    {
      return res.status(400).json({error : "The supplied password does not match with the one in the database"});
    }
    //CREATE ACCESSTOKEN
    const accessToken = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "1h" }
    );
    //CREATE REFRESH TOKEN
    const refreshToken = jwt.sign(
      {
        email: existingUser.email,
        id: existingUser.id,
        username: existingUser.username,
        role: existingUser.role,
      },
      process.env.ACCESS_KEY,
      { expiresIn: "7d" }
    );
    //SAVE REFRESH TOKEN TO DB
    existingUser.refreshToken = refreshToken;
    const savedUser = await existingUser.save();
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      domain: "localhost",
      path: "/api",
      maxAge: 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: "localhost",
      path: "/api",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    return res
      .status(200)
      .json({ data: { accessToken: accessToken, refreshToken: refreshToken } });
  } catch (error) {
    error.name = ""
    return res.status(400).json({ error: error.toString() });
  }
};

/**
 * Perform logout
  - Auth type: Simple
  - Request Body Content: None
  - Response `data` Content: A message confirming successful logout
  - Optional behavior:
    • Returns a 400 error if the request does not have a refresh token in the cookies
    • Returns a 400 error if the refresh token in the request's cookies does not represent a user in the database
 */
export const logout = async (req, res) => {
  try {

    const refreshToken = req.cookies.refreshToken;
    //400 error if the request does not have a refresh token in the cookies
    if (!refreshToken)
    {
      throw new Error("The request does not have a refresh token in the cookies");
    }

    //400 error if the refresh token in the request's cookies does not represent a user in the database
    const user = await User.findOne({ refreshToken: refreshToken });
    if (!user)
    {
      return res.status(400).json({error : "The refresh token in the request's cookies does not represent a user in the database"});
    }

    user.refreshToken = null;
    res.cookie("accessToken", "", {
      httpOnly: true,
      path: "/api",
      maxAge: 0,
      sameSite: "none",
      secure: true,
    });
    res.cookie("refreshToken", "", {
      httpOnly: true,
      path: "/api",
      maxAge: 0,
      sameSite: "none",
      secure: true,
    });

    await user.save();

    return res.status(200).json({data: { message: "User logged out" }});
  } catch (error) {
    error.name = ""
    return res.status(400).json({ error: error.toString() });
  }
};
