import React, { useState } from "react";
import './App.css';
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const OPENWEATHER_API_KEY = "614a1a8053b658115f2a149256b18797";
const UNSPLASH_ACCESS_KEY = "Z34sDvxbLQC2lpJOOccGiUcROyxtDGecHDsTlDVdE3w";

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

const getCountryName = (code) => {
  if (!code) return "Unknown Country";
  if (code === "GB") return "United Kingdom (UK)";
  return countries.getName(code, "en") || code;
};

function App() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [pinCodes, setPinCodes] = useState([]);
  const [backgroundUrl, setBackgroundUrl] = useState(
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1950&q=80'
  );

  const fetchCityInfo = async () => {
    setError("");
    setLocation(null);
    setPinCodes([]);

    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      // Fetch geo info
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData.length) {
        setError("City not found");
        return;
      }

      const cityInfo = geoData[0];
      setLocation(cityInfo);

      // Fetch pin codes
      const pinRes = await fetch(
        `https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`
      );
      const pinData = await pinRes.json();

      if (pinData[0].Status === "Success") {
        setPinCodes(pinData[0].PostOffice || []);
      } else {
        setPinCodes([]);
      }

      // Fetch background image from Unsplash API
      const unsplashRes = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(city)}&client_id=${UNSPLASH_ACCESS_KEY}&orientation=landscape`
      );
      const unsplashData = await unsplashRes.json();

      if (unsplashData && unsplashData.urls && unsplashData.urls.regular) {
        setBackgroundUrl(unsplashData.urls.regular);
      } else {
        // fallback image
        setBackgroundUrl('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1950&q=80');
      }

    } catch (err) {
      setError("Error fetching data");
      console.error(err);
    }
  };

  // Expanded if location found, pin codes present, or error exists
  const isExpanded = location || pinCodes.length > 0 || error;

  return (
    <>
      <div
        className="background"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div
        className="container"
        style={{
          maxHeight: isExpanded ? "1000px" : "150px",
          padding: isExpanded ? "3rem 3rem" : "2rem 2rem",
          overflow: isExpanded ? "visible" : "hidden",
          transition: "max-height 0.5s ease, padding 0.5s ease",
        }}
      >
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
            <p>
              <strong>🌍 Country:</strong>{" "}
              <img
                src={`https://flagcdn.com/w40/${location.country.toLowerCase()}.png`}
                alt={`${getCountryName(location.country)} flag`}
                style={{ width: "30px", height: "20px", verticalAlign: "middle", marginRight: "8px", borderRadius: "3px", boxShadow: "0 0 3px rgba(0,0,0,0.3)" }}
              />
              {getCountryName(location.country)}
            </p>
            <p><strong>🌐 Country Code:</strong> {location.country.toUpperCase()}</p>
          </div>
        )}

        {pinCodes.length > 0 && (
          <div className="pin-codes">
            <h3>📍 PIN Codes:</h3>
            <ul>
              {pinCodes.map((postOffice, index) => (
                <li key={index}>
                  <strong>{postOffice.Name}</strong>: {postOffice.Pincode}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
