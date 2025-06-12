import React, { useState } from "react";
import './App.css';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const OPENWEATHER_API_KEY = "614a1a8053b658115f2a149256b18797";

// Hardcoded list of Indian Union Territories
const unionTerritories = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function App() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  const getCountryName = (code) => {
    if (!code) return "Unknown Country";
    if (code === "GB") return "United Kingdom (UK)";
    return countries.getName(code, "en") || code;
  };

  const fetchCityInfo = async () => {
    setError("");
    setLocation(null);

    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        setError("City not found");
        return;
      }

      setLocation(geoData[0]);
    } catch (err) {
      setError("Error fetching data");
      console.error(err);
    }
  };

  return (
    <>
      <div className="background" />
      <div className="container">
        <h2>🌆 City Info Lookup</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="off"
          />
          <button onClick={fetchCityInfo}>🔍</button>
        </div>

        {error && <p className="error">{error}</p>}

        {location && (
          <div className="result-card">
            <p><strong>🏙️ City:</strong> {location.name}</p>
            <p>
              <strong>{unionTerritories.includes(location.state) ? "🏛️ Union Territory:" : "🏛️ State:"}</strong> {location.state || "N/A"}
            </p>
            <p><strong>🌍 Country Code:</strong> {location.country}</p>
            <p><strong>🌐 Country Name:</strong> {getCountryName(location.country)}</p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

