import mongoose from 'mongoose';

export async function startDbSession(): Promise<mongoose.ClientSession | null> {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch {
    return null;
  }
}
