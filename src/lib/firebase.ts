import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import config from "../../firebase-applet-config.json";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId || "(default)");
export const googleProvider = new GoogleAuthProvider();

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  isDemo?: boolean;
}

export {
  config,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
};

// Validate connection to Firestore as mandated by the Firebase skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline or waiting for network:", error.message);
      return false;
    }
    // Any other response means we connected to the server
    return true;
  }
}
