import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  corsOrigin:
    process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001",
};
