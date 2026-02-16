export function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              {/* Airline and flight number */}
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>

              {/* Flight times */}
              <div className="flex items-center space-x-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>

              {/* Duration and stops */}
              <div className="flex items-center space-x-4">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>

            {/* Price */}
            <div className="text-right space-y-2">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
