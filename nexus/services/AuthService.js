// services/AuthService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, Session, PasswordResetToken } from "../models/index.js";
import config from "../config/index.js";
import * as NotificationService from "./NotificationService.js";

class AuthService {
   constructor(options = {}) {
      this.jwtSecret = options.jwtSecret || config.jwt.secret;
      this.jwtExpiresIn = options.jwtExpiresIn || config.jwt.expiresIn;
      this.refreshTokenExpiresIn = options.refreshTokenExpiresIn || "7d";
   }

   // User registration
   async registerUser(userData) {
      const { email, password, firstName, lastName } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
         throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const user = new User({
         email,
         password: hashedPassword,
         firstName,
         lastName,
      });

      await user.save();

      // Send welcome email
      await NotificationService.sendEmail({
         to: user.email,
         subject: "Welcome to Nexus Inventory",
         template: "welcome",
         context: { user },
      });

      return { user, message: "User registered successfully" };
   }

   // User authentication
   async authenticateUser(email, password) {
      const user = await User.findOne({ email }).populate("role");
      if (!user) {
         throw new Error("Invalid credentials");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         throw new Error("Invalid credentials");
      }

      if (!user.isActive) {
         throw new Error("User account is deactivated");
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Create session
      await Session.create({
         user: user._id,
         refreshToken,
         expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return { user, accessToken, refreshToken };
   }

   // Refresh access token
   async refreshToken(token) {
      const session = await Session.findOne({ refreshToken: token });
      if (!session || session.expiresAt < new Date()) {
         throw new Error("Invalid or expired refresh token");
      }

      const user = await User.findById(session.user).populate("role");
      if (!user) {
         throw new Error("User not found");
      }

      // Generate new tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Update session with new refresh token
      session.refreshToken = refreshToken;
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await session.save();

      return { user, accessToken, refreshToken };
   }

   // Revoke tokens (logout)
   async revokeTokens(token) {
      await Session.deleteOne({ refreshToken: token });
      return { message: "Tokens revoked successfully" };
   }

   // Initiate password reset
   async initiatePasswordReset(email) {
      const user = await User.findOne({ email });
      if (!user) {
         // Do not reveal that the user does not exist
         return { message: "If a user with this email exists, a password reset link has been sent." };
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      await PasswordResetToken.create({
         user: user._id,
         token: hashedToken,
         expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Send password reset email
      const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
      await NotificationService.sendEmail({
         to: user.email,
         subject: "Password Reset Request",
         template: "password-reset",
         context: { user, resetUrl },
      });

      return { message: "Password reset link sent" };
   }

   // Complete password reset
   async completePasswordReset(token, newPassword) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const resetToken = await PasswordResetToken.findOne({
         token: hashedToken,
         expiresAt: { $gt: new Date() },
      });

      if (!resetToken) {
         throw new Error("Invalid or expired password reset token");
      }

      const user = await User.findById(resetToken.user);
      if (!user) {
         throw new Error("User not found");
      }

      // Update password
      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      // Delete reset token
      await PasswordResetToken.findByIdAndDelete(resetToken._id);

      // Send password change confirmation email
      await NotificationService.sendEmail({
         to: user.email,
         subject: "Password Changed Successfully",
         template: "password-changed",
         context: { user },
      });

      return { message: "Password has been reset successfully" };
   }

   // Social sign-in (e.g., Google, GitHub)
   async socialSignIn(provider, profile) {
      const { email, id, displayName } = profile;

      let user = await User.findOne({ email });

      if (user) {
         // User exists, update social provider info if necessary
         if (!user.socialProviders.some((p) => p.provider === provider)) {
            user.socialProviders.push({ provider, providerId: id });
            await user.save();
         }
      } else {
         // New user, create account
         user = new User({
            email,
            firstName: displayName.split(" ")[0],
            lastName: displayName.split(" ").slice(1).join(" "),
            socialProviders: [{ provider, providerId: id }],
            isVerified: true, // Social sign-in implies verified email
         });
         await user.save();

         // Send welcome email
         await NotificationService.sendEmail({
            to: user.email,
            subject: "Welcome to Nexus Inventory",
            template: "welcome-social",
            context: { user },
         });
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Create session
      await Session.create({
         user: user._id,
         refreshToken,
         expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return { user, accessToken, refreshToken };
   }

   // Generate JWT and refresh tokens
   async generateTokens(user) {
      const payload = {
         id: user._id,
         email: user.email,
         role: user.role?.name,
         permissions: this.getUserPermissions(user),
      };

      const accessToken = jwt.sign(payload, this.jwtSecret, {
         expiresIn: this.jwtExpiresIn,
      });

      const refreshToken = crypto.randomBytes(64).toString("hex");

      return { accessToken, refreshToken };
   }

   // Helper to get user permissions
   getUserPermissions(user) {
      if (!user.role || !user.role.permissions) {
         return [];
      }
      return user.role.permissions.map((p) => p.name);
   }
}

const authService = new AuthService();
export default authService;
