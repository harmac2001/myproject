import React from 'react'
import leftIcon from '../assets/left_icon.jpg'

export default function Header() {
    return (
        <header className="w-full relative">
            {/* Main Header Content - Dark Blue Background */}
            <div className="bg-[#344e6e] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Logo - Reduced size */}
                    <img
                        src={leftIcon}
                        alt="Proinde"
                        className="h-[32px] grayscale invert brightness-200 mix-blend-screen"
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
