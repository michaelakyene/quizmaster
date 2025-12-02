import { AuthService } from "./auth.service.js";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "../../utils/validators.js";

const authService = new AuthService();

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      // Validation
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (!validatePassword(password)) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      if (!validateRequired(name)) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Validate role if provided
      if (role && !["STUDENT", "ADMIN"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const result = await authService.register(email, password, name, role);

      res.status(201).json({
        message: "Registration successful",
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (!validateRequired(password)) {
        return res.status(400).json({ error: "Password is required" });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        message: "Login successful",
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}
