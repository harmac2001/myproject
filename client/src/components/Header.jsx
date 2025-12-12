import React, { useState } from 'react'
import headerLogo from '../assets/header_logo.png'
import { Settings } from 'lucide-react'
import ManagementSidebar from './ManagementSidebar'

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <header className="w-full relative">
            {/* Main Header Content - Dark Blue Background */}
            <div className="bg-[#000080] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo - Adjusted size (120% of original, -20% from previous) */}
                    <img
                        src={headerLogo}
                        alt="Proinde"
                        className="h-[29px] grayscale brightness-200 mix-blend-screen"
                    />
                </div>

                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium"
                >
                    <Settings className="h-4 w-4" />
                    <span>Manage Lists</span>
                </button>
            </div>
            {/* Yellow Bottom Strip */}
            <div className="h-2 bg-[#fff200] w-full"></div>

            <ManagementSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </header>
    )
}
