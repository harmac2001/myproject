import React from 'react'
import headerLogo from '../assets/header_logo.png'

export default function Header() {
    return (
        <header className="w-full relative">
            {/* Main Header Content - Dark Blue Background */}
            <div className="bg-[#344e6e] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo - Adjusted size (120% of original, -20% from previous) */}
                    <img
                        src={headerLogo}
                        alt="Proinde"
                        className="h-[38px] grayscale brightness-200 mix-blend-screen"
                    />
                </div>
                {/* Title - Optional, keeping it if needed or removing if image replaces it completely. 
                    User said "Replace the current header for this one", implying the image IS the header content.
                    But usually we keep the title. I'll keep the title but make it smaller or match the style.
                    Actually, the image shows "Proinde P&I". The current logo is leftIcon. 
                    I'll assume the leftIcon IS the Proinde logo. 
                */}
            </div>
            {/* Yellow Bottom Strip */}
            <div className="h-2 bg-[#fff200] w-full"></div>
        </header>
    )
}
