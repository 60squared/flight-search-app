interface AirlineFilterProps {
  selectedAirlines: string[];
  onChange: (airlines: string[]) => void;
  disabled?: boolean;
}

const AVAILABLE_AIRLINES = [
  { code: 'AF', name: 'Air France' },
  { code: 'KL', name: 'KLM' },
  { code: 'SK', name: 'SAS' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'UA', name: 'United' },
  { code: 'DL', name: 'Delta' },
  { code: 'AC', name: 'Air Canada' },
  { code: 'LX', name: 'Swiss' },
  { code: 'WN', name: 'Southwest' },
  { code: 'AS', name: 'Alaska Airlines' },
];

export function AirlineFilter({ selectedAirlines, onChange, disabled }: AirlineFilterProps) {
  const handleToggle = (code: string) => {
    if (selectedAirlines.includes(code)) {
      onChange(selectedAirlines.filter((a) => a !== code));
    } else {
      onChange([...selectedAirlines, code]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAirlines.length === AVAILABLE_AIRLINES.length) {
      // Deselect all
      onChange([]);
    } else {
      // Select all
      onChange(AVAILABLE_AIRLINES.map((a) => a.code));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Filter by Airline</label>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          {selectedAirlines.length === AVAILABLE_AIRLINES.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {AVAILABLE_AIRLINES.map((airline) => (
          <label
            key={airline.code}
            className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedAirlines.includes(airline.code)
                ? 'bg-primary-50 border-primary-300'
                : 'bg-white border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedAirlines.includes(airline.code)}
              onChange={() => handleToggle(airline.code)}
              disabled={disabled}
              className="mr-2 h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">{airline.name}</span>
          </label>
        ))}
      </div>
      {selectedAirlines.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedAirlines.length} airline{selectedAirlines.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
