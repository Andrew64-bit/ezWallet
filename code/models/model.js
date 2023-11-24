import mongoose, { Schema } from "mongoose";

const DEFAULT_CATEGORY = "investment";

const categories_model = new Schema({
    type: {
        type: String,
        required: true,
        default: DEFAULT_CATEGORY,
        unique: true
    },
    color: {
        type: String,
        required: true,
        default: "#fcbe44"
    }

});

const transaction_model = new Schema({
    username: {
        type: String,
        default: "Anonymous",
        required: true
    },
    type: {
        type: String,
        default: "investment",
        required: true
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const categories = mongoose.model("categories", categories_model);
const transactions = mongoose.model("transactions", transaction_model);

export { categories, transactions }

