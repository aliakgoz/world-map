import React from "react";

export function Tooltip({
    x,
    y,
    children,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{ left: x + 12, top: y + 12, position: "fixed" }}
            className="pointer-events-none z-40 rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
        >
            {children}
        </div>
    );
}
