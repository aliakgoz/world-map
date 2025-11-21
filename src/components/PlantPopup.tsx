import React from 'react';
import { NuclearPlant } from '../data/npp_data';

interface PlantPopupProps {
    plant: NuclearPlant;
    onClose: () => void;
}

export const PlantPopup: React.FC<PlantPopupProps> = ({ plant, onClose }) => {
    return (
        <div className="absolute top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-slate-800 text-lg leading-tight">{plant.Name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1
                        ${plant.Status === 'Operational' ? 'bg-green-100 text-green-800' :
                            plant.Status === 'Under Construction' ? 'bg-yellow-100 text-yellow-800' :
                                plant.Status === 'Shutdown' || plant.Status === 'Decommissioned' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                        {plant.Status}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-slate-500 text-xs">Country</p>
                        <p className="font-medium text-slate-700">{plant.Country} ({plant.CountryCode})</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs">Capacity</p>
                        <p className="font-medium text-slate-700">{plant.Capacity ? `${plant.Capacity} MW` : 'N/A'}</p>
                    </div>
                </div>

                <div className="text-sm">
                    <p className="text-slate-500 text-xs">Reactor Type</p>
                    <p className="font-medium text-slate-700">{plant.ReactorType || 'N/A'} {plant.ReactorModel ? `(${plant.ReactorModel})` : ''}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-100">
                    <div>
                        <p className="text-slate-500 text-xs">Construction Start</p>
                        <p className="font-medium text-slate-700">{plant.ConstructionStartAt || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs">Operational From</p>
                        <p className="font-medium text-slate-700">{plant.OperationalFrom || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
