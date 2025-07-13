
"use client";

import { redirect, usePathname } from 'next/navigation'
import { useEffect } from 'react';

export default function Home() {
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === '/') {
            redirect('/inbox');
        }
    }, [pathname]);

    // Render nothing or a loading spinner while redirecting
    return null;
}
