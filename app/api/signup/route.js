import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { full_name, email, password } = await req.json();

    // Validate input
    if (!email || !email.includes("@") || !password || password.length < 6) {
      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Travest");
    const collection = db.collection("users");

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return Response.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await collection.insertOne({
      full_name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId, email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send success + token
    return Response.json(
      { success: true, message: "User registered successfully", token },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
