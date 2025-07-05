
'use client';

import * as React from 'react';
import type { User } from '@/lib/data';
import { getLoggedInUser } from '@/lib/actions';

interface CurrentUserContextType {
    currentUser: User | null;
    isLoading: boolean;
}

const CurrentUserContext = React.createContext<CurrentUserContextType | null>(null);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchUser() {
            try {
                const user = await getLoggedInUser();
                setCurrentUser(user);
            } catch (error) {
                console.error("Failed to fetch logged in user", error);
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUser();
    }, []);

    const value = {
        currentUser,
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
