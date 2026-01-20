import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

if(!uri) throw new Error("Please enter the MONGODB_URI to .env")

let client
let clientPromise

if(process.env.NODE_ENV === "development"){
    if(!global._mongodbClientPromise){
        client = new MongoClient(uri)
        global._mongodbClientPromise = client.connect()
    }
    clientPromise = global._mongodbClientPromise    
} else{
    client = new MongoClient(uri)
    clientPromise = client.connect()
}

export default clientPromise

// Helpers
export async function getDb(dbName = process.env.MONGODB_DB || "Travest") {
  const client = await clientPromise
  return client.db(dbName)
}

export async function getUsersCollection() {
  const db = await getDb()
  const users = db.collection("users")
  // Ensure unique index on email
  await users.createIndex({ email: 1 }, { unique: true })
  return users
}

// Suggested shape (schemaless in MongoDB):
// {
//   email: String,
//   password: String,
//   otp: String,
//   otpExpiry: Date,
//   status: String, // pending_verification, verified
//   role: String, // investor, founder, fund_manager
//   is2FAEnabled: Boolean,
//   secretKey: String,
//   createdAt: Date,
//   updatedAt: Date
// }