import React, { useState } from 'react';
import {
  MapPin,
  Copy,
  ExternalLink,
  Check,
  Globe,
  Search,
  Navigation,
  Clipboard as ClipboardIcon,
  X,
} from 'lucide-react';
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
  const [source, setSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      // Check for center=lat,lng pattern (common in static map URLs from og:image)
      const centerMatch = inputUrl.match(/[?&]center=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/);
      if (centerMatch) {
         setCoords({
          lat: parseFloat(centerMatch[1]),
          lng: parseFloat(centerMatch[2]),
        });
        setError('');
        return;
      }

      setError(
        'Could not extract coordinates. Please ensure it is a valid Google Maps URL.'
      );
      setCoords(null);
    } catch {
      setError('Invalid URL format.');
      setCoords(null);
    }
  };

  const expandShortUrl = async (shortUrl: string): Promise<string> => {
    try {
      // 1. Try to fetch the page content via a CORS proxy
      // The browser follows redirects, so we get the content of the final Google Maps page.
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(shortUrl)}`;
      const response = await fetch(proxyUrl);
      const html = await response.text();

      // 2. Parse the HTML to find the canonical URL in meta tags
      // Google Maps consistently provides this: <meta property="og:url" content="...">
      // or <meta content="https://www.google.com/maps/..." itemprop="url">
      
      const metaUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i) 
        || html.match(/<meta\s+content="([^"]+)"\s+property="og:url"/i);

      if (metaUrlMatch && metaUrlMatch[1]) {
        return metaUrlMatch[1];
      }
      
      // Fallback: Check for og:image if og:url is missing. 
      // Sometimes og:url is not present but og:image contains the static map URL with coordinates.
      const metaImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) 
        || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);

      if (metaImageMatch && metaImageMatch[1]) {
        return metaImageMatch[1];
      }
      
      // If we couldn't find the meta tag, maybe the fetch landed on a consent page?
      // But usually OG tags are present even there or we get the redirect.
      
      return shortUrl;
    } catch (e) {
      console.error('Error expanding URL:', e);
      return shortUrl;
    }
  };

  // Re-define extract logic to optionally take a specific URL
  const processUrl = async (inputUrl: string) => {
    setError('');
    setCoords(null);
    setIsLoading(true);

    let finalUrl = inputUrl;

    // Check if it is a short URL
    if (inputUrl.includes('goo.gl') || inputUrl.includes('maps.app.goo.gl') || inputUrl.includes('bit.ly')) {
      const expanded = await expandShortUrl(inputUrl);
      if (expanded !== inputUrl) {
         finalUrl = expanded;
         // Only update input if it's a clean expansion and not an error
         if (!expanded.includes('error')) {
             setUrl(finalUrl); 
         }
      }
    }

    // Now extract
    extractCoordinates(finalUrl);
    setIsLoading(false);
  };

  const detectSource = (inputUrl: string) => {
    if (!inputUrl) return '';
    const lower = inputUrl.toLowerCase();

    if (
      (lower.includes('google') && lower.includes('/maps')) ||
      lower.includes('goo.gl')
    )
      return 'Google Maps';
    if (lower.includes('maps.apple.com')) return 'Apple Maps';
    if (lower.includes('openstreetmap.org')) return 'OpenStreetMap';
    if (lower.includes('bing.com/maps')) return 'Bing Maps';
    if (lower.includes('yandex.com/maps')) return 'Yandex Maps';
    if (lower.includes('wego.here.com')) return 'Here WeGo';
    if (lower.includes('waze.com')) return 'Waze';

    try {
      new URL(inputUrl);
      return 'Unknown Source';
    } catch {
      return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setSource(detectSource(val));
    if (!val.includes('goo.gl')) {
      extractCoordinates(val);
    }
  };

  const handleManualFind = () => {
    processUrl(url);
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
          <div className="logo-section">
            <div className="icon-wrapper">
              <Globe size={32} />
            </div>
            <h1>Map Bridge</h1>
          </div>
          <p className="subtitle">
            Extract precise coordinates from Google Maps links and bridge to any
            provider.
          </p>
        </div>

        <div className="input-group">
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Paste Google Maps URL here..."
              value={url}
              onChange={handleInputChange}
              className="url-input"
              onKeyDown={(e) => e.key === 'Enter' && handleManualFind()}
            />
            {url ? (
               <button
                className="action-btn clear"
                onClick={() => {
                  setUrl('');
                  setCoords(null);
                  setError('');
                }}
                title="Clear"
              >
                <X size={20} />
              </button>
            ) : (
              <button
                className="action-btn paste"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      setUrl(text);
                      setSource(detectSource(text));
                      if (
                        !text.includes('goo.gl') &&
                        !text.includes('maps.app.goo.gl')
                      ) {
                        extractCoordinates(text);
                      } else {
                          // If it is a short URL, trigger process
                          processUrl(text);
                      }
                    }
                  } catch (err) {
                    console.error('Failed to read clipboard', err);
                  }
                }}
                title="Paste from Clipboard"
              >
                <ClipboardIcon size={20} />
              </button>
            )}
            <button
              className="find-btn"
              onClick={handleManualFind}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
          {url && source && (
            <div className="url-source">
              <Navigation size={14} /> Source: {source}
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {coords && (
          <div className="result-section">
            <div className="coordinates-card">
              <div className="coord-row">
                <div className="coord-item">
                  <span className="label">Latitude</span>
                  <span className="value">{coords.lat}</span>
                </div>
                <div className="coord-item">
                  <span className="label">Longitude</span>
                  <span className="value">{coords.lng}</span>
                </div>
              </div>
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy Coordinates"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="providers-section">
              <h3>Bridge To</h3>
              <div className="providers-grid">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=16/${coords.lat}/${coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> OpenStreetMap <ExternalLink size={12} />
                </a>
                <a
                  href={`https://www.bing.com/maps?cp=${coords.lat}~${coords.lng}&lvl=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> Bing Maps <ExternalLink size={12} />
                </a>
                <a
                  href={`http://maps.apple.com/?ll=${coords.lat},${coords.lng}&z=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> Apple Maps <ExternalLink size={12} />
                </a>
                <a
                  href={`https://yandex.com/maps/?ll=${coords.lng},${coords.lat}&z=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> Yandex Maps <ExternalLink size={12} />
                </a>
                <a
                  href={`https://wego.here.com/?map=${coords.lat},${coords.lng},16,normal`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> Here WeGo <ExternalLink size={12} />
                </a>
                <a
                  href={`https://earth.google.com/web/@${coords.lat},${coords.lng},100a,35y,0h,0t,0r`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-link"
                >
                  <MapPin size={16} /> Google Earth <ExternalLink size={12} />
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
