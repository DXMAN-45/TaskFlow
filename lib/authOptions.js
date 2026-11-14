
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import clientPromise from "./mongodb";
import bcrypt from "bcryptjs";

import {
  ensureWorkspaceIndexes,
  ensureDefaultWorkspace,
} from "./workspace";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db("taskflow");

        const user = await db.collection("users").findOne({
          username: credentials.username.trim().toLowerCase(),
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email ?? null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      const client = await clientPromise;
      const db = client.db("taskflow");
      const users = db.collection("users");

      await ensureWorkspaceIndexes(db);

      // Credentials users are already authenticated against MongoDB.
      if (account?.provider === "credentials") {
        await ensureDefaultWorkspace(db, user.id);
        return true;
      }

      // Only handle Google and GitHub here.
      if (
        account?.provider !== "google" &&
        account?.provider !== "github"
      ) {
        return true;
      }

      if (!account.providerAccountId) {
        return false;
      }

      const providerIdField =
        account.provider === "google" ? "googleId" : "githubId";

      // Find an existing account linked to this provider.
      let dbUser = await users.findOne({
        [providerIdField]: account.providerAccountId,
      });

      if (!dbUser) {
        // Do not automatically link an existing account by email.
        const email = user.email?.trim().toLowerCase() || null;

        if (email) {
          const existingEmail = await users.findOne({ email });

          if (existingEmail) {
            return false;
          }
        }

        // Create a unique TaskFlow username.
        const usernameSource =
          email?.split("@")[0] ||
          user.name ||
          `${account.provider}_${account.providerAccountId}`;

        const baseUsername =
          usernameSource
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 20) || "user";

        let username = baseUsername;
        let counter = 1;

        while (await users.findOne({ username })) {
          username = `${baseUsername.slice(
            0,
            Math.max(1, 20 - String(counter).length)
          )}${counter}`;

          counter++;
        }

        const result = await users.insertOne({
          username,
          email,
          [providerIdField]: account.providerAccountId,
          name: user.name ?? username,
          image: user.image ?? null,
          createdAt: new Date(),
        });

        dbUser = await users.findOne({
          _id: result.insertedId,
        });
      }

      if (!dbUser) {
        return false;
      }

      // Initialize workspace for new and existing social users.
      await ensureDefaultWorkspace(db, dbUser._id.toString());

      return true;
    },

    async jwt({ token, user, account }) {
      // On initial sign-in, Credentials returns the MongoDB ID.
      if (account?.provider === "credentials" && user?.id) {
        token.id = user.id;
      }

      // Resolve Google and GitHub accounts to their MongoDB IDs.
      if (
        account?.provider === "google" ||
        account?.provider === "github"
      ) {
        const providerIdField =
          account.provider === "google"
            ? "googleId"
            : "githubId";

        const client = await clientPromise;
        const db = client.db("taskflow");

        const dbUser = await db.collection("users").findOne({
          [providerIdField]: account.providerAccountId,
        });

        if (!dbUser) {
          throw new Error("TaskFlow user record not found.");
        }

        token.id = dbUser._id.toString();
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
