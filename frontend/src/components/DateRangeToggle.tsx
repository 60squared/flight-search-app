interface DateRangeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function DateRangeToggle({ enabled, onChange, disabled }: DateRangeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mr-3 h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            Search flexible dates (±1 day)
          </span>
          <span className="text-xs text-gray-500">
            Find cheaper flights by searching nearby dates
          </span>
        </div>
      </label>

      {enabled && (
        <div className="ml-7 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">This will search multiple dates:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  One-way: <span className="font-semibold">3 searches</span> (±1 day from departure)
                </li>
                <li>
                  Round-trip:{' '}
                  <span className="font-semibold">9 searches</span> (±1 day from both dates)
                </li>
              </ul>
              <p className="mt-2 text-yellow-700">
                ⏱️ May take 3-10 seconds depending on trip type
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
