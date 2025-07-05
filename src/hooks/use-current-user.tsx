
'use client';

import * as React from 'react';
import type { User } from '@/lib/data';
import { getUsers } from '@/lib/actions';

interface CurrentUserContextType {
    currentUser: User | null;
    users: User[];
    setCurrentUser: (user: User) => void;
    isLoading: boolean;
}

const CurrentUserContext = React.createContext<CurrentUserContextType | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [users, setUsers] = React.useState<User[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchUsers() {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
                if (fetchedUsers.length > 0) {
                    const storedUserId = localStorage.getItem('vocalmail_current_user_id');
                    const initialUser = storedUserId ? fetchedUsers.find(u => u.id === parseInt(storedUserId, 10)) : fetchedUsers[0];
                    setCurrentUser(initialUser || fetchedUsers[0]);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const handleSetCurrentUser = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('vocalmail_current_user_id', user.id.toString());
    };

    const value = {
        currentUser,
        users,
        setCurrentUser: handleSetCurrentUser,
        isLoading,
    };

    return (
        <CurrentUserContext.Provider value={value}>
            {children}
        </CurrentUserContext.Provider>
    );
}

export function useCurrentUser() {
    const context = React.useContext(CurrentUserContext);
    if (!context) {
        throw new Error('useCurrentUser must be used within a CurrentUserProvider');
    }
    return context;
}
