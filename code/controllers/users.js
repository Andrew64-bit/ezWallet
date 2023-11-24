import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import mongoose from "mongoose";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    //Admin check
    const adminAuth = verifyAuth(req, res, {authType: "Admin"})

    if(!adminAuth.flag)
    {
      return res.status(401).json({error: "Unauthorized, only Admin can access Users informations"})
    }

    

    //Case no user inside the DB
    if (User.countDocuments() == 0) {
      return res.status(200).json({data: [], refreshedTokenMessage: res.locals.refreshedTokenMessage});
    }

    const users = await User.find({}, 'username email role -_id')
    return res.status(200).json({data: users, refreshedTokenMessage: res.locals.refreshedTokenMessage});

  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
  try {
    //Returns a 400 error if the username passed as the route parameter does not represent a user in the database
    const username = req.params.username;
    const user = await User.findOne({ username: username }, 'username email role -_id')
    if (!user) return res.status(400).json({ error: "User not found in the DB" });

    //Is an Admin calling this function?
    const adminAuth = verifyAuth(req, res, {authType: "Admin"})
    if(adminAuth.flag)
    {
      return res.status(200).json({data: user, refreshedTokenMessage: res.locals.refreshedTokenMessage})
    }
    else
    {
      //Not an Admin, is the User accessing his own information?
      const userAuth = verifyAuth(req, res, {authType: "User", username: username})

      if(!userAuth.flag)
      {
        //Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter nor an admin
        return res.status(401).json({error : userAuth.cause})
      }
      else
      {
        return res.status(200).json({data: user, refreshedTokenMessage: res.locals.refreshedTokenMessage})
      }
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
  try {

    const groupName = req.body.name;
    const groupMembers = req.body.memberEmails;


    //Returns a 401 error if called by a user who is not authenticated (authType = Simple)
    const simpleAuth = verifyAuth(req, res, {authType: "Simple"})
    if(!simpleAuth.flag)
    {
      return res.status(401).json({error: "The user is not authenticated"});
    }

    //Returns a 400 error if the request body does not contain all the necessary attributes
    if((!groupName || !groupMembers) && groupName !== "" )
    {
      return res.status(400).json({error: "The request body does not contain all the necessary attributes"});
    }

    //Returns a 400 error if the group name passed in the request body is an empty string
    if(groupName === "")
    {
      return res.status(400).json({error: "The group name passed in the request body is an empty string"});
    }

    //Returns a 400 error if the group name passed in the request body represents an already existing group in the database
    const group = await Group.findOne({ name: groupName });
    if(group)
    {
      return res.status(400).json({error: "The group name passed in the request body represents an already existing group in the database"});
    }

    //Returns a 400 error if the user who calls the API is already in a group
    const user = await User.findOne({refreshToken : req.cookies.refreshToken})
    const isInGroup = await Group.findOne({ "members.email": user.email });
    if(isInGroup)
    {
      return res.status(400).json({error: "The user who calls the API is already in a group"});
    }

    //Returns a 400 error if at least one of the member emails is not in a valid email format
    //or
    //Returns a 400 error if at least one of the member emails is an empty string
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    for (const member of groupMembers)
    {
      if(member === "")
      {
        return res.status(400).json({error: "At least one of the member emails is an empty string"});
      }
      if(!member.match(regexExp))
      {
        return res.status(400).json({error: "At least one of the member emails is not in a valid email format"});
      }
    }

    //If the user who calls the API does not have his email in the list of emails then added 
    if(!groupMembers.includes(user.email))
    {
      groupMembers.push(user.email)
    }

    let alreadyInGroup = [];
    let membersNotFound = [];
    let membersToAdd = [];
    let membersToAddEmails = [];

    //Check each email to check existance and presence in another group
    for (const member of groupMembers) {
      let memberExists = await User.findOne({ email: member });
      let isInGroup = await Group.findOne({ "members.email": member });

      if (!memberExists) 
      {
        membersNotFound.push({email : member});
      } 
      else if (isInGroup) 
      {
        alreadyInGroup.push({email : member});
      } 
      else 
      {
        const userToAdd = new mongoose.Types.ObjectId(memberExists._id);
        membersToAdd.push({ email: member, user: userToAdd });
        membersToAddEmails.push({email : member});
      }
    }
    
    //Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database
    if (membersToAdd.length === 1)
      {
      return res.status(400).json({error: "All the `memberEmails` either do not exist or they are already in a group"});
    }

    //new Group in model schema
    await Group.create({
      name: groupName,
      members: membersToAdd,
    });

    res.status(200).json({
      data : {
        group: {
          name: groupName,
          members: membersToAddEmails,
        },
        alreadyInGroup: alreadyInGroup,
        membersNotFound: membersNotFound,
      }, 
      refreshedTokenMessage: res.locals.refreshedTokenMessage
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    //Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
    const adminAuth = verifyAuth(req, res, {authType: "Admin"})

    if(!adminAuth.flag)
    {
      return res.status(401).json({error: "Unauthorized, only Admin can access Groups informations"})
    }

    const groups = await Group.find({}).select({name : 1, members : 1});

    const result = [];
    for(const group of groups)
    {
      const mailsToAdd = []
      for(const member of group.members)
      {
        mailsToAdd.push({email : member.email});
      }
      const toAdd = {
        name : group.name,
        members : mailsToAdd
      }
      result.push(toAdd)
    }

    return res.status(200).json({data : result, refreshedTokenMessage : res.locals.refreshedTokenMessage});

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {

    const groupName = req.params.name;

    //Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
    let group = await Group.findOne({ name: groupName }).select({ name : 1, members: 1 });
    if (!group) {
      return res.status(400).json({ error: "Group not found" });
    }

    //Returns a 401 error if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)
    const adminAuth = verifyAuth(req, res, {authType: "Admin"}) 
    if (!adminAuth.flag) {
      const emails = []
      for(const member of group.members)
      {
        emails.push(member.email);
      }
      const groupAuth = verifyAuth(req, res, {authType: "Group", emails: emails})

      if(!groupAuth.flag)
      {
        return res.status(401).json({ error: "User who is neither part of the group nor an admin" });
      }
    }
    
    const mailsToAdd = []
    for(const member of group.members)
    {
      mailsToAdd.push({email : member.email});
    }
    const toAdd = {
      name : group.name,
      members : mailsToAdd
    }
    

    //Response data Content
    return res.status(200).json({data: {group: toAdd} , refreshedTokenMessage: res.locals.refreshedTokenMessage})

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {
    
    const groupMembers = req.body.emails;
    const groupName = req.params.name;

    //Returns a 400 error if the request body does not contain all the necessary attributes
    if(!groupMembers || !groupName)
    {
      return res.status(400).json({ error: "The request body does not contain all the necessary attributes" });
    }

    //Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
    const group = await Group.findOne({ name: groupName }).select({
      name: 1,
      members: 1,
    });
    if (!group) {
      return res.status(400).json({ error: "Group not found" });
    }

    //Returns a 400 error if at least one of the member emails is not in a valid email format
    //or
    //Returns a 400 error if at least one of the member emails is an empty string
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    for (const member of groupMembers)
    {
      if(member === "")
      {
        return res.status(400).json({error: "At least one of the member emails is an empty string"});
      }
      if(!member.match(regexExp))
      {
        return res.status(400).json({error: "At least one of the member emails is not in a valid email format"});
      }
    }

    //Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/add
    if(req.originalUrl.includes("add"))
    {
      const emails = [];
      for(const member of group.members)
      {
        emails.push(member.email)
      }
      const groupAuth = verifyAuth(req, res, {authType: "Group", emails: emails})
      if(!groupAuth.flag)
      {
        return res.status(401).json({error: groupAuth.cause});
      }
    }

    //Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/insert
    if(req.originalUrl.includes("insert"))
    {
      const adminAuth = verifyAuth(req, res, {authType: "Admin"})
      if(!adminAuth.flag)
      {
        return res.status(401).json({error: adminAuth.cause});
      }
    }

    let alreadyInGroup = [];
    let membersNotFound = [];
    let membersToAdd = [];

    //Check each email to check existance and presence in another group
    for (const member of groupMembers) {
      let memberExists = await User.findOne({ email: member });
      let isInGroup = await Group.findOne({ "members.email": member });

      if (!memberExists) 
      {
        membersNotFound.push({email : member});
      } 
      else if (isInGroup) 
      {
        alreadyInGroup.push({email : member});
      } else 
      {
        const userToAdd = new mongoose.Types.ObjectId(memberExists._id);
        membersToAdd.push({ email: member, user: userToAdd });
      }
    }

    //Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database
    if (membersToAdd.length === 0) 
    {
      return res.status(400).json({ error: "All the `memberEmails` either do not exist or are already in a group"});
    }

    //update Group
    for (const member of membersToAdd) {
      await Group.findOneAndUpdate(
        { name: groupName },
        { $push: { members: member } }
      ).exec();
    }

    const updatedGroup = await Group.findOne({ name: groupName }).select({ name: 1, members: 1 })
    
    const mailsToAdd = []
    for(const member of updatedGroup.members)
    {
      mailsToAdd.push({email : member.email});
    }
    const toAdd = {
      name : updatedGroup.name,
      members : mailsToAdd
    }

    //Response data
    return res.status(200).json({
      data : {
        group: {
          name: updatedGroup.name, 
          members: toAdd.members
        }, 
        membersNotFound: membersNotFound, 
        alreadyInGroup: alreadyInGroup
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
  try {
    const groupMembers = req.body.emails;
    const groupName = req.params.name;

    //Returns a 400 error if the request body does not contain all the necessary attributes
    if(!groupMembers)
    {
      return res.status(400).json({error : "The request body does not contain all the necessary attributes"})
    }

    //Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
    const group = await Group.findOne({ name: groupName }).select({name: 1, members: 1});
    if (!group) {
      return res.status(400).json({ error: "Group not found" });
    }

    //Returns a 400 error if at least one of the emails is not in a valid email format
    //or
    //Returns a 400 error if at least one of the emails is an empty string
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    for (const member of groupMembers)
    {
      if(member === "")
      {
        return res.status(400).json({error: "At least one of the member emails is an empty string"});
      }
      if(!member.match(regexExp))
      {
        return res.status(400).json({error: "At least one of the member emails is not in a valid email format"});
      }
    }

    //Returns a 400 error if the group contains only one member before deleting any user
    if(group.members.length === 1)
    {
      return res.status(400).json({error: "The group contains only one member"});
    }

    //Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is api/groups/:name/remove
    if(req.originalUrl.includes("remove"))
    {
      const emails = [];
      for(const member of group.members)
      {
        emails.push(member.email)
      }
      const groupAuth = verifyAuth(req, res, {authType: "Group", emails: emails})
      if(!groupAuth.flag)
      {
        return res.status(401).json({error: groupAuth.cause});
      }
    }

    //Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is api/groups/:name/pull
    if(req.originalUrl.includes("pull"))
    {
      const adminAuth = verifyAuth(req, res, {authType: "Admin"})
      if(!adminAuth.flag)
      {
        return res.status(401).json({error: adminAuth.cause});
      }
    }

    //Returns a 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database

    let isNotInGroup = [];
    let membersNotFound = [];
    let membersToRemove = [];

    for (const member of groupMembers) {
      let memberExists = await User.findOne({ email: member });

      if (!memberExists) 
      {
        membersNotFound.push(member); 
      } 
      else 
      {
        let found = 0;
        //Search email of member to remove in group members
        for (const m of group.members) 
        {
          if (m.email === member) found = 1;
        }

        if ((found === 0)) 
        {
          isNotInGroup.push(member); 
        } 
        else 
        {
          membersToRemove.push(member);
        }
      }
    }

    //Check the presence of at least one valid member to remove for the group
    if (membersToRemove.length === 0) 
    {
      return res.status(400).json({ error: "All the `memberEmails` either do not exist or are not in the group"});
    }

    //update Group
    await Group.findOneAndUpdate(
        { name: groupName },
        { $pull: { members: { email : { $in : membersToRemove } }} }
    ).exec();


    const updatedGroup = await Group.findOne({ name: groupName }).select({ name: 1, members: 1 }).exec()

    const mailsToAdd = []
    for(const member of updatedGroup.members)
    {
      mailsToAdd.push({email : member.email});
    }
    const toAdd = {
      name : updatedGroup.name,
      members : mailsToAdd
    }

    //Response data
    return res.status(200).json({
      data: {
        group: { 
          name: updatedGroup.name, 
          members: toAdd.members
        }, 
        membersNotFound: membersNotFound, 
        notInGroup: isNotInGroup
      },
      refreshedTokenMessage: res.locals.refreshedTokenMessage
    })

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {

    const { email } = req.body;

    //Returns a 400 error if the request body does not contain all the necessary attributes
    if(!email && email !== "")
    {
      return res.status(400).json({ error: "The request body does not contain all the necessary attributes" });
    }

    //Returns a 400 error if the email passed in the request body is an empty string
    if(email === "")
    {
      return res.status(400).json({ error: "The email passed in the request body is an empty string" });
    }

    //Returns a 400 error if the email passed in the request body is not in correct email format
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    if(!email.match(regexExp))
    {
      return res.status(400).json({error: "The email passed in the request body is not in correct email format"});
    }

    //Returns a 400 error if the email passed in the request body does not represent a user in the database
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    //Returns a 400 error if the user to delete is an admin
    if(user.role === "Admin")
    {
      return res.status(400).json({error: "Cannot delete an admin"});
    }


    //Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
    const adminAuth = verifyAuth(req, res, {authType: "Admin"})
    if(!adminAuth.flag)
    {
      return res.status(401).json({error: adminAuth.cause});
    }

    
    let transactionsNumber = 0;
    let deleted = false;

    //Delete user
    User.deleteOne({ email: email });

    //Check the presence in a group
    const group = await Group.findOne({"members.email": email});

    if (group) 
    {
      //Case of last member remaining in the group --> delete group
      if(group.members.length === 1)
      {
        //Delete group
        await Group.deleteOne({ name: group.name });
      }
      else
      {
        //Update the group
        await Group.updateOne({ name: group.name },{ $pull: { members: { email: email }}});
      }
         
      deleted = true;
    }

    //Delete transactions
    transactionsNumber = await transactions.deleteMany({ username: user.username });

    //Response body
    return res.status(200).json({
      data: {
        deletedTransactions: transactionsNumber.deletedCount,
        deletedFromGroup: deleted
      }, 
      refreshedTokenMessage: res.locals.refreshedTokenMessage
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  try {
    const groupName = req.body.name;

//Returns a 400 error if the name passed in the request body is an empty string
    if(groupName === "")
    {
      return res.status(400).json({ error: "The name passed in the request body is an empty string" });
    }

    //Returns a 400 error if the request body does not contain all the necessary attributes
    if(!groupName)
    {
      return res.status(400).json({ error: "The request body does not contain all the necessary attributes" });
    }



    //Returns a 400 error if the name passed in the request body does not represent a group in the database
    const group = await Group.findOne({ name: groupName });
    if (!group) {
      return res.status(400).json({ error: "Group not found" });
    }

    //Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
    const adminAuth = verifyAuth(req, res, {authType: "Admin"})
    if(!adminAuth.flag)
    {
      return res.status(401).json({error: adminAuth.cause});
    }
    
    //Delete group
    await Group.deleteOne({ name: groupName });

    //Response data
    return res.status(200).json({
      data: {message: "Group deleted successfully"} , 
      refreshedTokenMessage: res.locals.refreshedTokenMessage
    })

  } catch (err) {
    res.status(500).json(err.message);
  }
};
