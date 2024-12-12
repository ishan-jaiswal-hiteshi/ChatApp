import express from "express";
import bcrypt from "bcrypt";
import User from "../models/users_Model.js";
import Randomstring from "randomstring";
import jwt from "jsonwebtoken";

const router = express.Router();

// Register user
router.post("/registerUser", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const generatedId = `${name}-${Randomstring.generate(7)}`;
      let check_userId = await User.findOne({ where: { userId: generatedId } });
      if (check_userId) {
        generatedId = `${name}.${Randomstring.generate(7)}`;
      }
      user = await User.create({
        name,
        userId: generatedId,
        email,
        password: hashedPassword,
      });
    }

    // Fetch the updated user list
    const usersList = await User.findAll({
      attributes: ["userId", "name", "email"],
    });
    io.emit("allRegUsers", { usersList });

    res.status(200).json({
      userId: user.userId,
      name: user.name,
      email: user.email,
    });
    console.log(`User registered: ${user.userId} ${name} (${email})`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/loginUser", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ error: "User not found. Please register." });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      userId: user.userId,
      name: user.name,
      email: user.email,
    });
    console.log(`User logged in: ${user.userId} ${user.name}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
