import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()
const conn = mongoose.connect(process.env.MONGO_URI).then((db) => {
    console.log('DB Connected')
    return db
}).catch((err) => {
    console.log(err)
})

export default conn;