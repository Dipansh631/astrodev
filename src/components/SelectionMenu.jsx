
import React, { useState } from 'react';

const SelectionMenu = ({ onAdminRegister, isLocked, isAdmin }) => {
    // Add local state to track request status for the session
    const [requestStatus, setRequestStatus] = useState({
        admin: false, // false: not sent, true: sent
    });

    const handleOptionClick = (label) => {
        if (label === "Register as Admin") {
            if (isLocked) return;

            if (isAdmin) {
                alert("You are already an Admin!");
                return;
            }

            if (requestStatus.admin) return; // Prevent double click

            // Trigger the parent handler
            if (onAdminRegister) {
                onAdminRegister();
                setRequestStatus(prev => ({ ...prev, admin: true }));
            }
        } else if (label === "Register as Member") {
            window.open("https://forms.google.com/member-registration", "_blank");
        } else if (label === "Apply for Role in Club") {
            window.open("https://forms.google.com/role-application", "_blank");
        }
    };

    const options = [
        {
            label: "Register as Admin",
            color: isLocked ? "from-gray-700 to-gray-800" : "from-blue-500 to-cyan-500",
            disabled: requestStatus.admin || isLocked,
            statusText: isLocked
                ? "ACCESS LOCKED: POSITIONS FILLED"
                : (requestStatus.admin ? "Request Sent to Poseidon" : null)
        },
        { label: "Register as Member", color: "from-purple-500 to-pink-500" },
        { label: "Apply for Role in Club", color: "from-amber-500 to-orange-500" }
    ];

    return (
        <div className="flex flex-col items-center justify-center space-y-6 z-50">
            {options.map((option, index) => (
                <button
                    key={index}
                    disabled={option.disabled}
                    className={`group relative w-80 p-[2px] rounded-xl overflow-hidden transition-transform transform 
                        ${option.disabled ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95 focus:outline-none'}`}
                    onClick={() => handleOptionClick(option.label)}
                >
                    {/* Gradient Border */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${option.color} animate-gradient-xy opacity-75 group-hover:opacity-100 transition-opacity`} />

                    {/* Inner Content */}
                    <div className="relative w-full h-full bg-[#1a1a1a]/90 backdrop-blur-xl rounded-xl px-8 py-4 flex flex-col items-center justify-center">
                        <span className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${option.disabled ? 'from-gray-500 to-gray-600' : 'from-white to-gray-400'} group-hover:text-white transition-colors`}>
                            {option.label}
                        </span>
                        {option.statusText && (
                            <span className={`text-[10px] ${isLocked ? 'text-red-500' : 'text-green-400'} mt-1 font-mono tracking-widest uppercase animate-pulse`}>
                                {option.statusText}
                            </span>
                        )}
                    </div>

                    {/* Glow Effect */}
                    {!option.disabled && (
                        <div className={`absolute -inset-1 bg-gradient-to-r ${option.color} blur-lg opacity-20 group-hover:opacity-50 transition-opacity duration-500`} />
                    )}
                </button>
            ))}
        </div>
    );
};

export default SelectionMenu;
