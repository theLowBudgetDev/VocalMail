
'use client';

import * as React from 'react';
import type { User } from '@/lib/data';
import { getLoggedInUser } from '@/lib/actions';

interface CurrentUserContextType {
    currentUser: User | null;
    isLoading: boolean;
}

const CurrentUserContext = React.createContext<CurrentUserContextType | null>(null);

export function CurrentUserProvider({ children, initialUser }: { children: React.ReactNode, initialUser?: User | null }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(initialUser === undefined ? null : initialUser);
    const [isLoading, setIsLoading] = React.useState(initialUser === undefined);

    React.useEffect(() => {
        // If the user is passed from a Server Component, we don't need to fetch it again.
        if (initialUser !== undefined) return;

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
    }, [initialUser]);

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
