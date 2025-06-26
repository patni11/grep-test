import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import { findOrCreateUser } from '@/lib/db/users'
import { initializeCollections } from '@/lib/db/schemas'

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo', // Request repo access for GitHub API
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Initialize database collections on first run
      try {
        const client = await clientPromise
        const db = client.db()
        await initializeCollections(db)
      } catch (error) {
        console.log('Collections already initialized or error:', error)
      }

      // Store/update user data in our custom users collection
      if (account?.provider === 'github' && profile) {
        try {
          const githubProfile = profile as any // GitHub profile
          await findOrCreateUser({
            id: githubProfile.id?.toString() || user.id,
            login: githubProfile.login || githubProfile.name || user.name || '',
            email: githubProfile.email || user.email || '',
            avatar_url: githubProfile.avatar_url || user.image || '',
            access_token: account.access_token, // Store GitHub access token for API calls
          })
        } catch (error) {
          console.error('Error storing user data:', error)
        }
      }
      
      return true
    },
    async session({ session, token, user }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account && user) {
        token.id = user.id
        token.accessToken = account.access_token
      }
      return token
    },
  },
  session: {
    strategy: 'database',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 