import type { Workout } from "@/data/mockData";

export interface UserProfile {
  name: string;
  email: string;
  password: string;
  goal: string;
  unit: string;
  memberSince: string;
}

const KEYS = {
  currentUser: "fittrack_current_user",
  users: "fittrack_users",
  workouts: (email: string) => `fittrack_workouts_${email}`,
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerUser = (name: string, email: string, password: string): boolean => {
  const users = getUsers();
  if (users[email]) return false; // already exists
  users[email] = {
    name,
    email,
    password,
    goal: "build-muscle",
    unit: "lbs",
    memberSince: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
  localStorage.setItem(KEYS.users, JSON.stringify(users));
  return true;
};

export const loginUser = (email: string, password: string): UserProfile | null => {
  const users = getUsers();
  const user = users[email];
  if (!user || user.password !== password) return null;
  localStorage.setItem(KEYS.currentUser, email);
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.currentUser);
};

export const getCurrentUser = (): UserProfile | null => {
  const email = localStorage.getItem(KEYS.currentUser);
  if (!email) return null;
  const users = getUsers();
  return users[email] || null;
};

export const updateUserProfile = (updates: Partial<UserProfile>) => {
  const email = localStorage.getItem(KEYS.currentUser);
  if (!email) return;
  const users = getUsers();
  if (!users[email]) return;
  users[email] = { ...users[email], ...updates };
  localStorage.setItem(KEYS.users, JSON.stringify(users));
};

const getUsers = (): Record<string, UserProfile> => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.users) || "{}");
  } catch {
    return {};
  }
};

// ─── Workouts ────────────────────────────────────────────────────────────────

export const saveWorkout = (workout: Workout) => {
  const email = localStorage.getItem(KEYS.currentUser);
  if (!email) return;
  const existing = getWorkouts();
  const updated = [workout, ...existing];
  localStorage.setItem(KEYS.workouts(email), JSON.stringify(updated));
};

export const getWorkouts = (): Workout[] => {
  const email = localStorage.getItem(KEYS.currentUser);
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.workouts(email)) || "[]");
  } catch {
    return [];
  }
};

export const deleteWorkout = (id: string) => {
  const email = localStorage.getItem(KEYS.currentUser);
  if (!email) return;
  const updated = getWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(KEYS.workouts(email), JSON.stringify(updated));
};