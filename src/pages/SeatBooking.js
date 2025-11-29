import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { API_BASE_URL } from "../config/api";
import { useUserAuth } from "../contexts/UserAuthContext";

const SeatBooking = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserAuth();

  // Initialize seat layout (A-H rows with 12 seats each)
  const initializeSeats = () => {
    const seats = {};
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 12;
    // Make all seats available by default - no pre-reserved seats
    const reservedSeats = []; // Empty array - all seats available

    rows.forEach((row) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatId = `${row}${i}`;
        seats[seatId] = {
          id: seatId,
          status: reservedSeats.includes(seatId) ? "reserved" : "available",
        };
      }
    });
    return seats;
  };

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState(initializeSeats());

  // Fetch existing bookings for the selected movie, date, and time
  const fetchExistingBookings = useCallback(async (movie, date, time) => {
    if (!movie || !date || !time) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/showtime?movie=${encodeURIComponent(
          movie.title
        )}&date=${date}&time=${encodeURIComponent(time)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const bookings = await response.json();
        const bookedSeats = bookings.flatMap((booking) => booking.seats);

        // Update seats state to mark booked seats as reserved
        setSeats((prevSeats) => {
          const updatedSeats = { ...prevSeats };
          Object.keys(updatedSeats).forEach((seatId) => {
            if (bookedSeats.includes(seatId)) {
              updatedSeats[seatId].status = "reserved";
            } else {
              updatedSeats[seatId].status = "available";
            }
          });
          return updatedSeats;
        });
      }
    } catch (error) {
      console.error("Error fetching existing bookings:", error);
      // If error, reset to all available seats
      setSeats(initializeSeats());
    }
  }, []);

  // Update seats when movie, date, or time changes
  useEffect(() => {
    fetchExistingBookings(selectedMovie, selectedDate, selectedTime);
  }, [selectedMovie, selectedDate, selectedTime, fetchExistingBookings]);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/user/login", {
        state: { from: "/booking" },
        replace: true,
      });
    }
  }, [isAuthenticated, navigate]);

  // Convert 24-hour time format to 12-hour format with AM/PM
  const formatTime12Hour = (time24) => {
    if (!time24) return time24;

    const [hours, minutes] = time24.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";

    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get available times for a specific date
  const getAvailableTimesForDate = useCallback(
    (movie, date) => {
      let times = [];

      if (movie.showtimes && movie.showtimes.length > 0) {
        // Filter showtimes by selected date
        const matchingShowtimes = movie.showtimes.filter((showtime) => {
          // Normalize both dates for comparison
          const showtimeDate = new Date(showtime.date)
            .toISOString()
            .split("T")[0];
          const selectedDate = new Date(date).toISOString().split("T")[0];
          return showtimeDate === selectedDate;
        });

        times = matchingShowtimes.map((showtime) =>
          formatTime12Hour(showtime.time)
        );
      } else if (movie.times && movie.times.length > 0) {
        // For backward compatibility, show old times only for today
        const today = new Date().toISOString().split("T")[0];
        if (date === today) {
          times = movie.times.map((time) => formatTime12Hour(time));
        }
      }

      setAvailableTimes(times);

      // If current selected time is not available for new date, clear it
      if (selectedTime && !times.includes(selectedTime)) {
        setSelectedTime(null);
      }
    },
    [selectedTime]
  );

  // Fetch complete movie data from API when localStorage data is incomplete
  const fetchCompleteMovieData = useCallback(
    async (movieId, fallbackMovie) => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/movies`);
        const data = await response.json();

        if (data.success) {
          const completeMovie = data.movies.find((m) => m._id === movieId);
          if (completeMovie) {
            console.log(
              "Fetched fresh movie data:",
              completeMovie.title,
              completeMovie.showtimes
            );
            // Update localStorage with complete movie data
            const updatedMovie = {
              ...completeMovie,
              id: completeMovie._id, // Keep backward compatibility
              time: fallbackMovie.time, // Preserve the selected time
            };
            localStorage.setItem("selectedMovie", JSON.stringify(updatedMovie));

            setSelectedMovie(updatedMovie);
            setSelectedTime(fallbackMovie.time);
            // Don't call getAvailableTimesForDate here - let the useEffect handle it
          } else {
            // Movie not found, use fallback
            setSelectedMovie(fallbackMovie);
            setSelectedTime(fallbackMovie.time);
            // Don't call getAvailableTimesForDate here - let the useEffect handle it
          }
        }
      } catch (error) {
        console.error("Error fetching complete movie data:", error);
        // Use fallback data in case of error
        setSelectedMovie(fallbackMovie);
        setSelectedTime(fallbackMovie.time);
        // Don't call getAvailableTimesForDate here - let the useEffect handle it
      } finally {
        setLoading(false);
      }
    },
    [] // No dependencies needed since we're not calling getAvailableTimesForDate here anymore
  );

  // Load movie data only on component mount
  useEffect(() => {
    const movieData = localStorage.getItem("selectedMovie");
    if (movieData) {
      const movie = JSON.parse(movieData);
      console.log("Initial movie load:", movie.title);

      // Always fetch fresh data to ensure we have the latest showtimes
      if (movie.id || movie._id) {
        fetchCompleteMovieData(movie.id || movie._id, movie);
      } else {
        setSelectedMovie(movie);
        setSelectedTime(movie.time);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update available times when date changes or movie is loaded
  useEffect(() => {
    if (selectedMovie) {
      getAvailableTimesForDate(selectedMovie, selectedDate);
    }
  }, [selectedDate, selectedMovie, getAvailableTimesForDate]);

  const handleSeatClick = (seatId) => {
    if (seats[seatId].status === "reserved") return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const getSeatClass = (seatId) => {
    const baseClasses =
      "w-8 h-8 m-1 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200 transform hover:scale-105";

    if (seats[seatId].status === "reserved") {
      return `${baseClasses} bg-red-400 dark:bg-red-600 text-white cursor-not-allowed opacity-60`;
    }
    if (selectedSeats.includes(seatId)) {
      return `${baseClasses} bg-primary text-white shadow-lg border-2 border-primary cursor-pointer`;
    }
    return `${baseClasses} bg-green-400 dark:bg-green-600 text-white cursor-pointer hover:bg-primary hover:shadow-md`;
  };

  // Get price for a specific time and date
  const getPriceForTime = useCallback(
    (time, date = selectedDate) => {
      if (!selectedMovie || !date) {
        return 15; // Default fallback price
      }

      // Find the matching showtime for specified date and time
      if (selectedMovie.showtimes && selectedMovie.showtimes.length > 0) {
        const matchingShowtime = selectedMovie.showtimes.find((showtime) => {
          const showtimeDate = new Date(showtime.date)
            .toISOString()
            .split("T")[0];
          const currentDate = new Date(date).toISOString().split("T")[0];
          const showtimeTime = formatTime12Hour(showtime.time);

          return showtimeDate === currentDate && showtimeTime === time;
        });

        if (matchingShowtime && matchingShowtime.price !== undefined) {
          return matchingShowtime.price;
        }
      }

      return 15; // Default fallback price
    },
    [selectedMovie, selectedDate]
  );

  // Get current price based on selected date and time
  const getCurrentPrice = useCallback(() => {
    return getPriceForTime(selectedTime, selectedDate);
  }, [getPriceForTime, selectedTime, selectedDate]);

  const calculateTotal = () => {
    const pricePerSeat = getCurrentPrice();
    return selectedSeats.length * pricePerSeat;
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        navigate("/user/login", {
          state: { from: "/booking" },
          replace: true,
        });
        return;
      }

      const bookingData = {
        movieTitle: selectedMovie?.title || "Dune: Part Two",
        movieDuration: selectedMovie?.duration || "2h 30min",
        movieImageUrl: selectedMovie?.imageUrl || selectedMovie?.image,
        hall: selectedMovie?.hall || "Theater 1",
        seats: selectedSeats,
        date: selectedDate,
        time: selectedTime || selectedMovie?.time || "7:30 PM",
        totalPrice: calculateTotal(),
        pricePerSeat: getCurrentPrice(),
      };

      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (result.success) {
        // Store booking info for confirmation page
        const confirmationData = {
          ...result.booking,
          user: user,
          date:
            selectedDate === new Date().toISOString().split("T")[0]
              ? "Today"
              : new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
        };
        localStorage.setItem(
          "bookingConfirmation",
          JSON.stringify(confirmationData)
        );
        navigate("/confirmation");
      } else {
        alert(`Booking failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderSeatRow = (rowLetter) => {
    const rowSeats = [];
    for (let i = 1; i <= 12; i++) {
      const seatId = `${rowLetter}${i}`;
      const isAisle = i === 4 || i === 9; // Create aisles after seat 3 and 8

      if (isAisle) {
        rowSeats.push(<div key={`${seatId}-aisle`} className="w-4"></div>);
      }

      rowSeats.push(
        <div
          key={seatId}
          className={getSeatClass(seatId)}
          onClick={() => handleSeatClick(seatId)}
          title={`Seat ${seatId} - ${
            seats[seatId].status === "reserved"
              ? "Reserved"
              : selectedSeats.includes(seatId)
              ? "Selected"
              : "Available"
          }`}
        >
          {seatId}
        </div>
      );
    }

    return (
      <div key={rowLetter} className="flex items-center justify-center mb-3">
        <div className="w-8 text-center text-background-dark/60 dark:text-background-light/60 font-semibold mr-4">
          {rowLetter}
        </div>
        <div className="flex items-center">{rowSeats}</div>
        <div className="w-8 text-center text-background-dark/60 dark:text-background-light/60 font-semibold ml-4">
          {rowLetter}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      <div className="flex min-h-screen flex-col">
        <Header variant="cineticket" />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center text-sm text-background-dark/60 dark:text-background-light/60 mb-4">
              <Link
                className="hover:text-primary dark:hover:text-primary"
                to="/"
              >
                Movies
              </Link>
              <span className="mx-2">/</span>
              <Link
                className="hover:text-primary dark:hover:text-primary"
                to="/"
              >
                {selectedMovie?.title || "Dune: Part Two"}
              </Link>
              <span className="mx-2">/</span>
              <span className="font-medium text-background-dark dark:text-background-light">
                Select Seats
              </span>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-8 text-center border-b border-primary/20">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-primary/20 p-3 rounded-full mr-4">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      event_seat
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-background-dark dark:text-white">
                      Select Your Seats
                    </h2>
                    <p className="text-background-dark/70 dark:text-background-light/70 mt-1">
                      Choose your preferred seats for{" "}
                      <span className="font-semibold text-primary">
                        {selectedMovie?.title || "Dune: Part Two"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm text-background-dark/60 dark:text-background-light/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      schedule
                    </span>
                    <span>
                      {selectedTime || selectedMovie?.time || "7:30 PM"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      location_on
                    </span>
                    <span>Theater 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      calendar_today
                    </span>
                    <span>
                      {selectedDate === new Date().toISOString().split("T")[0]
                        ? "Today"
                        : new Date(selectedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Date and Time Selection */}
                <div className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-lg p-6 border border-primary/20">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Date Selection */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl">
                          calendar_today
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Select Date
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choose a date to view available showtimes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-sm font-medium"
                        />
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {selectedDate ===
                          new Date().toISOString().split("T")[0]
                            ? "Today"
                            : new Date(selectedDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                        </div>
                      </div>
                    </div>

                    {/* Time Selection */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl">
                          schedule
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Available Times
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Select your preferred showtime
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {loading ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              Loading latest showtimes...
                            </div>
                          </div>
                        ) : availableTimes.length > 0 ? (
                          availableTimes.map((time, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedTime(time)}
                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                selectedTime === time
                                  ? "bg-primary text-white shadow-lg"
                                  : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-primary/10 dark:hover:bg-primary/20"
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span>{time}</span>
                                <span
                                  className={`text-xs ${
                                    selectedTime === time
                                      ? "text-white/80"
                                      : "text-primary font-medium"
                                  }`}
                                >
                                  ${getPriceForTime(time).toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                            No times available for selected date
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Screen */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div
                      className="w-80 h-6 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-t-3xl shadow-lg border-2 border-primary/30"
                      style={{
                        clipPath: "polygon(15% 0, 85% 0, 100% 100%, 0% 100%)",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-t-3xl" />
                    <p className="text-center text-sm text-background-dark/60 dark:text-background-light/60 mt-2 font-semibold">
                      🎬 SCREEN 🎬
                    </p>
                  </div>
                </div>

                {/* Seat Layout */}
                <div className="mb-8 bg-background-light/30 dark:bg-background-dark/30 rounded-xl p-6">
                  <div className="max-w-4xl mx-auto">
                    {["A", "B", "C", "D", "E", "F", "G", "H"].map((row) =>
                      renderSeatRow(row)
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-center items-center gap-8 mb-8">
                  <div className="flex items-center gap-3 bg-white dark:bg-card-dark px-4 py-2 rounded-lg shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-green-400 dark:bg-green-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A1</span>
                    </div>
                    <span className="text-sm font-medium text-background-dark/70 dark:text-background-light/70">
                      Available
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-card-dark px-4 py-2 rounded-lg shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-primary border-2 border-primary flex items-center justify-center shadow-lg">
                      <span className="text-white text-xs font-bold">B2</span>
                    </div>
                    <span className="text-sm font-medium text-background-dark/70 dark:text-background-light/70">
                      Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-card-dark px-4 py-2 rounded-lg shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-red-400 dark:bg-red-600 flex items-center justify-center opacity-60">
                      <span className="text-white text-xs font-bold">C3</span>
                    </div>
                    <span className="text-sm font-medium text-background-dark/70 dark:text-background-light/70">
                      Booked
                    </span>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-6 border border-primary/20">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex-1">
                      <div className="mb-4">
                        <p className="text-sm text-background-dark/60 dark:text-background-light/60 mb-1">
                          Movie & Showtime
                        </p>
                        <p className="font-semibold text-background-dark dark:text-white">
                          {selectedMovie?.title || "Dune: Part Two"} •{" "}
                          {selectedTime || selectedMovie?.time || "7:30 PM"}
                        </p>
                        <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                          {selectedDate ===
                          new Date().toISOString().split("T")[0]
                            ? "Today"
                            : new Date(selectedDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                        </p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-background-dark/60 dark:text-background-light/60 mb-1">
                          Selected Seats ({selectedSeats.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSeats.length > 0 ? (
                            selectedSeats.map((seat) => (
                              <span
                                key={seat}
                                className="px-3 py-1 bg-primary text-white text-sm rounded-full font-semibold"
                              >
                                {seat}
                              </span>
                            ))
                          ) : (
                            <span className="text-background-dark/60 dark:text-background-light/60 italic">
                              No seats selected
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-background-dark/60 dark:text-background-light/60 mb-1">
                          Total Amount
                        </p>
                        <p className="text-3xl font-bold text-background-dark dark:text-white">
                          <span className="text-primary">
                            ${calculateTotal().toFixed(2)}
                          </span>
                          {selectedSeats.length > 0 && (
                            <span className="text-sm text-background-dark/60 dark:text-background-light/60 font-normal ml-2">
                              (${getCurrentPrice().toFixed(2)} ×{" "}
                              {selectedSeats.length} seat
                              {selectedSeats.length > 1 ? "s" : ""})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                      <Link
                        to="/"
                        className="px-8 py-3 rounded-lg text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center"
                      >
                        ← Back to Movies
                      </Link>
                      <button
                        onClick={handleReserveSeats}
                        disabled={selectedSeats.length === 0}
                        className="px-8 py-3 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                      >
                        {selectedSeats.length === 0
                          ? "Select Seats to Continue"
                          : `Reserve ${selectedSeats.length} Seat${
                              selectedSeats.length > 1 ? "s" : ""
                            }`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SeatBooking;
