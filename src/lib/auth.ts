import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { findOrCreateUser, getUserByGithubId } from '@/lib/db/users'

export const authOptions: NextAuthOptions = {
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
      // Store user data in our custom users collection

      //await initializeDatabase()
      if (account?.provider === 'github' && profile) {
        try {
          const githubProfile = profile as any
          await findOrCreateUser({
            id: githubProfile.id?.toString() || user.id,
            login: githubProfile.login || githubProfile.name || user.name || '',
            email: githubProfile.email || user.email || '',
            avatar_url: githubProfile.avatar_url || user.image || '',
            access_token: account.access_token, // Store GitHub access token
          })
        } catch (error) {
          console.error('Error storing user data:', error)
        }
      }
      
      return true
    },
    async session({ session, token }) {
      // Get user data from our custom collection and add to session
      session.accessToken = token.accessToken as string;
      if (token.githubId) {
        try {
          const user = await getUserByGithubId(token.githubId as string)
          if (user) {
            session.user.id = user._id!
            session.accessToken = user.access_token
            session.user.name = user.username
            session.user.email = user.email
            session.user.image = user.avatar_url
          }
        } catch (error) {
          console.error('Error fetching user in session:', error)
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Store GitHub ID in JWT token for session callback
      if (account?.access_token) {
        token.githubId = (profile as any).id?.toString()
        token.accessToken = account.access_token
      }
      return token
    },
  },
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions
  },
  secret: process.env.NEXTAUTH_SECRET,
} 