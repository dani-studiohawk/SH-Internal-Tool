/**
 * NextAuth.js API route handler
 * Handles all authentication requests (/api/auth/*)
 */

import NextAuth from "next-auth"
import { authOptions } from "../../../lib/auth"

export default NextAuth(authOptions)