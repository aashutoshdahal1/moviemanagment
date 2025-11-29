import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { API_BASE_URL } from "../config/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeMovies, setActiveMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Convert 24-hour time format to 12-hour format with AM/PM
  const formatTime12Hour = (time24) => {
    if (!time24) return time24;

    const [hours, minutes] = time24.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get all available times for a movie (for today or general display)
  const getAvailableShowtimes = (movie) => {
    if (movie.showtimes && movie.showtimes.length > 0) {
      // For new format, show today's showtimes or next available
      const today = new Date().toISOString().split("T")[0];
      const todayShowtimes = movie.showtimes.filter(
        (showtime) => showtime.date === today
      );
      if (todayShowtimes.length > 0) {
        return todayShowtimes.map((showtime) => showtime.time);
      }
      // If no showtimes for today, show first few available
      return movie.showtimes.slice(0, 3).map((showtime) => showtime.time);
    } else if (movie.times && movie.times.length > 0) {
      // For backward compatibility
      return movie.times;
    }
    return [];
  };

  // Fetch movies from API on component mount
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/movies`);
      const data = await response.json();

      if (data.success) {
        console.log("Fetched movies:", data.movies);
        // Separate movies by status
        const active = data.movies.filter((movie) => movie.status === "active");
        const comingSoon = data.movies.filter(
          (movie) => movie.status === "coming-soon"
        );

        console.log("Active movies:", active);
        setActiveMovies(active);
        setComingSoonMovies(comingSoon);
      } else {
        setError("Failed to fetch movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Unable to load movies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelection = (movie, time) => {
    // Store the complete movie data in localStorage for the booking flow
    const movieData = {
      ...movie,
      time: time,
    };
    console.log("Saving movie data to localStorage:", movieData);
    localStorage.setItem("selectedMovie", JSON.stringify(movieData));
    navigate("/booking");
  };

  const handleMovieCardClick = (movie) => {
    const availableTimes = getAvailableShowtimes(movie);
    if (availableTimes.length > 0) {
      // Select the first available time for card click
      handleTimeSelection(movie, availableTimes[0]);
    }
  };

  const renderMovieGrid = (movies, showBookingButton = true) => (
    <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
      {movies.map((movie) => (
        <div
          key={movie._id}
          className={`flex flex-col overflow-hidden rounded-lg bg-white dark:bg-card-dark shadow-lg transition-transform duration-300 hover:scale-105 ${
            showBookingButton && getAvailableShowtimes(movie).length > 0
              ? "cursor-pointer"
              : ""
          }`}
          onClick={() => showBookingButton && handleMovieCardClick(movie)}
        >
          <div className="relative h-56 w-full">
            {movie.imageUrl ? (
              <img
                src={movie.imageUrl}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // Replace with local fallback instead of external URL
                  e.target.style.display = "none";
                  const parent = e.target.parentNode;
                  if (!parent.querySelector(".movie-fallback")) {
                    const fallbackDiv = document.createElement("div");
                    fallbackDiv.className =
                      "movie-fallback absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center";
                    fallbackDiv.innerHTML =
                      '<span class="material-symbols-outlined text-6xl text-gray-400">movie</span>';
                    parent.appendChild(fallbackDiv);
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-gray-400">
                  movie
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {movie.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {movie.duration} | {movie.hall}
              </p>
              {movie.genre && (
                <p className="mt-1 text-sm text-primary font-medium">
                  {movie.genre}
                </p>
              )}
              {movie.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {movie.description}
                </p>
              )}
            </div>
            {showBookingButton && (
              <div className="mt-6 flex flex-wrap gap-2">
                {(() => {
                  const availableTimes = getAvailableShowtimes(movie);
                  return availableTimes.length > 0 ? (
                    availableTimes.map((time, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when clicking time button
                          handleTimeSelection(movie, time);
                        }}
                        className="rounded px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {formatTime12Hour(time)}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No showtimes available
                    </span>
                  );
                })()}
              </div>
            )}
            {!showBookingButton && (
              <div className="mt-6">
                <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200 min-h-screen">
      <div className="flex min-h-screen w-full flex-col">
        <Header variant="cinemagic" />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading movies...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 dark:text-red-400 mb-4">
                    <span className="material-symbols-outlined text-6xl">
                      error
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <button
                    onClick={fetchMovies}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : activeMovies.length === 0 && comingSoonMovies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <span className="material-symbols-outlined text-6xl">
                      movie
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No movies available at the moment.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Please check back later for new releases!
                  </p>
                </div>
              ) : (
                <>
                  {/* Show Coming Soon as main section if no active movies */}
                  {activeMovies.length === 0 && comingSoonMovies.length > 0 ? (
                    <div id="coming-soon">
                      <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Coming Soon
                      </h2>
                      {renderMovieGrid(comingSoonMovies, false)}
                    </div>
                  ) : (
                    <>
                      {/* Now Showing Section */}
                      {activeMovies.length > 0 && (
                        <div id="now-showing">
                          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Now Showing
                          </h2>
                          {renderMovieGrid(activeMovies, true)}
                        </div>
                      )}

                      {/* Coming Soon Section */}
                      {comingSoonMovies.length > 0 && (
                        <div id="coming-soon" className="mt-16">
                          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Coming Soon
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">
                            Get ready for these upcoming releases!
                          </p>
                          {renderMovieGrid(comingSoonMovies, false)}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
