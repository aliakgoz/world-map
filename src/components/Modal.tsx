import React, { useEffect } from "react";

export function Modal({
    open,
    onClose,
    children,
}: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Close"
                >
                    ✕
                </button>
                {children}
            </div>
        </div>
    );
}
