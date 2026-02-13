import React, { useState } from 'react';
import { MapPin, Copy, ExternalLink, Check } from 'lucide-react';
import './GeoLocationFinder.css';

interface Coordinates {
  lat: number;
  lng: number;
}

const GeoLocationFinder: React.FC = () => {
  const [url, setUrl] = useState('');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const extractCoordinates = (inputUrl: string) => {
    try {
      if (!inputUrl) {
        setCoords(null);
        setError('');
        return;
      }

      // Check for !3d and !4d pattern (usually marker position)
      const latMatch = inputUrl.match(/!3d(-?\d+\.\d+)/);
      const lngMatch = inputUrl.match(/!4d(-?\d+\.\d+)/);

      if (latMatch && lngMatch) {
        setCoords({
          lat: parseFloat(latMatch[1]),
          lng: parseFloat(lngMatch[1]),
        });
        setError('');
        return;
      }

      // Check for @lat,lng pattern (viewport center)
      const atMatch = inputUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        setCoords({
          lat: parseFloat(atMatch[1]),
          lng: parseFloat(atMatch[2]),
        });
        setError('');
        return;
      }

      // Check for ?q=lat,lng pattern
      const qMatch = inputUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        setCoords({
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2]),
        });
        setError('');
        return;
      }

      setError(
        'Could not extract coordinates. Please ensure it is a valid Google Maps URL.',
      );
      setCoords(null);
    } catch {
      setError('Invalid URL format.');
      setCoords(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    extractCoordinates(val);
  };

  const handleCopy = () => {
    if (coords) {
      const text = `${coords.lat}, ${coords.lng}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="finder-container">
      <div className="finder-card">
        <div className="finder-header">
          <div className="icon-wrapper">
            <MapPin size={32} />
          </div>
          <h2>Google Maps Location Extractor</h2>
          <p>
            Paste a Google Maps link to extract exact coordinates and verify
            with other providers.
          </p>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Paste Google Maps URL here..."
            value={url}
            onChange={handleInputChange}
            className="url-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {coords && (
          <div className="result-section">
            <div className="coordinates-display">
              <div className="coord-item">
                <span className="label">Latitude</span>
                <span className="value">{coords.lat}</span>
              </div>
              <div className="coord-item">
                <span className="label">Longitude</span>
                <span className="value">{coords.lng}</span>
              </div>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy Coordinates"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>

            <div className="providers-section">
              <h3>Verify Location</h3>
              <div className="providers-grid">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  OpenStreetMap <ExternalLink size={14} />
                </a>
                <a
                  href={`https://www.bing.com/maps?cp=${coords.lat}~${coords.lng}&lvl=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  Bing Maps <ExternalLink size={14} />
                </a>
                <a
                  href={`http://maps.apple.com/?ll=${coords.lat},${coords.lng}&z=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  Apple Maps <ExternalLink size={14} />
                </a>
                <a
                  href={`https://yandex.com/maps/?ll=${coords.lng},${coords.lat}&z=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  Yandex Maps <ExternalLink size={14} />
                </a>
                <a
                  href={`https://wego.here.com/?map=${coords.lat},${coords.lng},16,normal`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  Here WeGo <ExternalLink size={14} />
                </a>
                <a
                  href={`https://earth.google.com/web/@${coords.lat},${coords.lng},100a,35y,0h,0t,0r`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  Google Earth <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoLocationFinder;
