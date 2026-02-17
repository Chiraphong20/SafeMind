import { UserRegistration, UserStatus } from '../types';

const STORAGE_KEY = 'registrai_users';

export const getUsers = (): UserRegistration[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (userData: Omit<UserRegistration, 'id' | 'status' | 'timestamp'>) => {
  const users = getUsers();
  const newUser: UserRegistration = {
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
    status: UserStatus.PENDING,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...users, newUser]));
};

export const updateUserStatus = (id: string, status: UserStatus) => {
  const users = getUsers();
  const updatedUsers = users.map(user => 
    user.id === id ? { ...user, status } : user
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
};

export const deleteUser = (id: string) => {
  const users = getUsers();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users.filter(u => u.id !== id)));
};