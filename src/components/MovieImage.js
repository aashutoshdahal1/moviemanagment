import React, { useState } from "react";

const MovieImage = ({
  src,
  alt,
  className = "",
  fallbackIcon = "movie",
  showFallbackForCancelled = false,
  isBookingCancelled = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Don't show image if booking is cancelled and showFallbackForCancelled is false
  const shouldShowFallback =
    !src || hasError || (isBookingCancelled && showFallbackForCancelled);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (shouldShowFallback) {
    const iconToShow = isBookingCancelled ? "block" : fallbackIcon;
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
      >
        <span className="material-symbols-outlined text-gray-400">
          {iconToShow}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};

export default MovieImage;
