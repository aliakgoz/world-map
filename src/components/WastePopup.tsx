import { WasteFacilityRow } from "../lib/db";

type WastePopupProps = {
    facility: WasteFacilityRow;
    onClose: () => void;
};

export function WastePopup({ facility, onClose }: WastePopupProps) {
    return (
        <div className="absolute left-4 top-4 z-50 w-80 rounded-xl bg-white p-4 shadow-xl ring-1 ring-black/10">
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-slate-900">{facility.name}</h3>
                    <p className="text-xs text-slate-500">{facility.site_name}</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-3 text-sm">
                <div>
                    <span className="block text-xs font-medium text-slate-500">Type</span>
                    <span className="font-medium text-slate-900">{facility.facility_type}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="block text-xs font-medium text-slate-500">Status</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${facility.status.toLowerCase().includes('operational') ? 'bg-green-100 text-green-700' :
                            facility.status.toLowerCase().includes('construction') ? 'bg-yellow-100 text-yellow-700' :
                                facility.status.toLowerCase().includes('closed') || facility.status.toLowerCase().includes('decommission') ? 'bg-red-100 text-red-700' :
                                    'bg-slate-100 text-slate-700'
                            }`}>
                            {facility.status}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs font-medium text-slate-500">Country</span>
                        <span className="font-medium text-slate-900">{facility.iso3}</span>
                    </div>
                </div>

                <div>
                    <span className="block text-xs font-medium text-slate-500">Waste Level</span>
                    <span className="font-medium text-slate-900">{facility.waste_level}</span>
                </div>

                <div>
                    <span className="block text-xs font-medium text-slate-500">Waste Types</span>
                    <span className="font-medium text-slate-900">{facility.waste_types}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="block text-xs font-medium text-slate-500">Commissioning</span>
                        <span className="font-medium text-slate-900">{facility.commissioning_year || '—'}</span>
                    </div>
                    <div>
                        <span className="block text-xs font-medium text-slate-500">Closure</span>
                        <span className="font-medium text-slate-900">{facility.closure_year || '—'}</span>
                    </div>
                </div>

                {facility.source_cite && (
                    <div className="border-t pt-2">
                        <span className="block text-xs font-medium text-slate-500">Source</span>
                        <span className="text-xs text-slate-600 italic">{facility.source_cite}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
