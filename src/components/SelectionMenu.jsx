import React from 'react';

const SelectionMenu = () => {
    const options = [
        { label: "Register as Admin", color: "from-blue-500 to-cyan-500" },
        { label: "Register as Member", color: "from-purple-500 to-pink-500" },
        { label: "Apply for Role in Club", color: "from-amber-500 to-orange-500" }
    ];

    return (
        <div className="flex flex-col items-center justify-center space-y-6 z-50">
            {options.map((option, index) => (
                <button
                    key={index}
                    className="group relative w-80 p-[2px] rounded-xl overflow-hidden transition-transform transform hover:scale-105 active:scale-95 focus:outline-none"
                    onClick={() => console.log(`Selected: ${option.label}`)}
                >
                    {/* Gradient Border */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${option.color} animate-gradient-xy opacity-75 group-hover:opacity-100 transition-opacity`} />

                    {/* Inner Content */}
                    <div className="relative w-full h-full bg-[#1a1a1a]/90 backdrop-blur-xl rounded-xl px-8 py-4 flex items-center justify-center">
                        <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:text-white transition-colors">
                            {option.label}
                        </span>
                    </div>

                    {/* Glow Effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${option.color} blur-lg opacity-20 group-hover:opacity-50 transition-opacity duration-500`} />
                </button>
            ))}
        </div>
    );
};

export default SelectionMenu;
