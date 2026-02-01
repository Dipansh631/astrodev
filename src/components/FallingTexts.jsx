import React, { useState, useEffect } from 'react';

const textSequence = [
    { text: "Dive into the space", sub: "", duration: 3000, align: "left" },
    { text: "Introducing Astro Club", sub: "", duration: 3000, align: "right" },
    { text: "Sameeraj", sub: "Alumni", duration: 4000, align: "left" },
    { text: "Created by Dipanshu Maheshwari (Web Head)", sub: "Collaboration with Yash Shakya", duration: 5000, align: "center", position: "top", highlight: true },
    { text: "Aditi", sub: "Current President", duration: 5000, align: "left" },
    { text: "Dhruv", sub: "Vice President", duration: 5000, align: "right" },
    { text: "Yashashvi Gupta", sub: "Design Idea", duration: 5000, align: "left" }
];

const FallingTexts = () => {
    const [currentData, setCurrentData] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        let timeouts = [];
        let accumulatedTime = 0;

        textSequence.forEach((item, index) => {
            // SHOW event
            const showTime = accumulatedTime;
            timeouts.push(setTimeout(() => {
                setCurrentData(item);
                setShow(true);
            }, showTime));

            accumulatedTime += item.duration;

            // HIDE event (slightly before the next one to allow fade out)
            const hideTime = accumulatedTime - 500;
            timeouts.push(setTimeout(() => {
                setShow(false);
            }, hideTime));
        });

        return () => {
            timeouts.forEach(t => clearTimeout(t));
        };
    }, []);

    if (!currentData) return null;

    const isRight = currentData.align === 'right';
    const isCenter = currentData.align === 'center';
    const isTop = currentData.position === 'top';
    const isHighlight = currentData.highlight;

    let containerClasses = "absolute inset-0 z-30 pointer-events-none flex w-full px-10 md:px-32 ";

    if (isTop) {
        containerClasses += "items-start pt-32 justify-center text-center";
    } else {
        containerClasses += `items-end md:items-center pb-24 md:pb-0 ${isRight ? 'justify-end' : isCenter ? 'justify-center' : 'justify-start'}`;
    }

    return (
        <div className={containerClasses}>
            <div
                className={`
                    transition-all duration-700 transform
                    ${show ? 'opacity-100 translate-y-0 filter blur-0' : 'opacity-0 translate-y-10 filter blur-sm'}
                    ${isRight ? 'text-right' : isCenter || isTop ? 'text-center' : 'text-left'}
                `}
            >
                <h2
                    className={`
                        font-bold text-transparent bg-clip-text bg-gradient-to-r 
                        ${isHighlight
                            ? 'from-yellow-300 via-orange-400 to-red-500 text-4xl md:text-6xl drop-shadow-[0_0_35px_rgba(255,165,0,0.6)]'
                            : 'from-blue-200 via-cyan-200 to-white text-4xl md:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        }
                    `}
                >
                    {currentData.text}
                </h2>
                {currentData.sub && (
                    <p className={`mt-2 text-xl md:text-3xl text-gray-300 font-light tracking-widest uppercase ${isHighlight ? 'text-yellow-100' : ''}`}>
                        {currentData.sub}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FallingTexts;
