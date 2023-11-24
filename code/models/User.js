import mongoose from 'mongoose'

const DEFAULT_USER = "Regular";

export const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        max: 255,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String
    },
    role: {
        type: String,
        default: DEFAULT_USER,
    }
}, {
    timestamps: true,
});

export const GroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: "group",
        unique: true
    },
    members: [
        {
            email: {
                type: String,
                required: true
            },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        }
    ]
})

const Group = mongoose.model("Group", GroupSchema)
const User = mongoose.model('User', UserSchema);
export { Group, User }