-- Create User table
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);
