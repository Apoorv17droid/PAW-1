import { useState } from "react";
import { X } from "lucide-react";
import { INDIA_VIEWBOX, INDIA_PATHS, STATE_ZONE, ZONE_COLORS } from "../indiaPaths.js";
import { tr } from "../translations.js";

export default function MapModal({ lang, onClose, onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{tr("mapTitle", lang)}</h3>
          <button className="icon-btn" onClick={onClose} aria-label={tr("mapClose", lang)}>
            <X size={20} />
          </button>
        </div>
        <p className="modal-hint">{tr("mapHint", lang)}</p>
        <div className="map-name-slot">{hovered || "\u00A0"}</div>
        <div className="map-frame">
          <svg viewBox={INDIA_VIEWBOX} className="india-svg">
            {Object.entries(INDIA_PATHS).map(([name, paths]) => {
              const zone = STATE_ZONE[name] || "Alluvial";
              const color = ZONE_COLORS[zone];
              return paths.map((d, i) => (
                <path
                  key={name + i}
                  d={d}
                  fill={color}
                  stroke="#FBF8F1"
                  strokeWidth={1}
                  className="state-path"
                  style={{ opacity: hovered === name ? 0.7 : 1 }}
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(name, zone)}
                />
              ));
            })}
          </svg>
        </div>
        <div className="legend">
          {Object.entries(ZONE_COLORS).map(([zone, color]) => (
            <div className="legend-item" key={zone}>
              <span className="legend-swatch" style={{ background: color }} />
              {zone}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
