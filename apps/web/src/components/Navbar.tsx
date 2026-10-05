// src/components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b">
            <Link href="/" className="font semibold text-xl">
                Spatial Platform
            </Link>

            <div className="flex gap-6">
                <Link href="/live">Live</Link>
                <Link href="/risk">Risk</Link>
                <Link href="/simulate">Simulate</Link>
            </div>  
        </nav>
    );
}