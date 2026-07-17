import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, name: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          name,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}
