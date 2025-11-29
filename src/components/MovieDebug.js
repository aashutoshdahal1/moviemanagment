import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

const MovieDebug = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/movies`);
        const data = await response.json();
        console.log("Debug - Fetched movies:", data.movies);
        setMovies(data.movies || []);
      } catch (error) {
        console.error("Debug - Error fetching movies:", error);
      }
    };

    fetchMovies();
  }, []);

  const testSaveMovie = (movie) => {
    const movieData = {
      ...movie,
      time: movie.times?.[0] || "20:30",
    };
    console.log("Debug - Saving movie:", movieData);
    localStorage.setItem("selectedMovie", JSON.stringify(movieData));

    // Immediately check what was saved
    const saved = localStorage.getItem("selectedMovie");
    console.log("Debug - Saved data:", JSON.parse(saved));
  };

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        margin: "20px",
        border: "1px solid black",
      }}
    >
      <h2>Movie Debug Component</h2>
      <p>Total movies: {movies.length}</p>
      {movies.map((movie) => (
        <div
          key={movie._id}
          style={{ border: "1px solid gray", padding: "10px", margin: "10px" }}
        >
          <h3>{movie.title}</h3>
          <p>Status: {movie.status}</p>
          <p>Times: {JSON.stringify(movie.times)}</p>
          <p>Showtimes: {JSON.stringify(movie.showtimes)}</p>
          <button onClick={() => testSaveMovie(movie)}>
            Test Save This Movie
          </button>
        </div>
      ))}
    </div>
  );
};

export default MovieDebug;
