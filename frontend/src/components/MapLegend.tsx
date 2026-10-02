import React from 'react';
import { useMap } from 'react-leaflet';
import './MapLegend.css';
import { useEffect } from 'react';
import L from 'leaflet';
import type { RiskLevel } from '../types';

interface MapLegendProps {
  counts: Record<RiskLevel, number>;
  total: number;
}

export default function MapLegend({ counts, total }: MapLegendProps) {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <div class="legend-title">Risk Level</div>
        <div class="legend-item"><span class="legend-dot" style="background:#22c55e"></span>Low (${counts.Low})</div>
        <div class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span>Medium (${counts.Medium})</div>
        <div class="legend-item"><span class="legend-dot" style="background:#f97316"></span>High (${counts.High})</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444"></span>Critical (${counts.Critical})</div>
        <div class="legend-total">Total: ${total} parcels</div>
      `;
      return div;
    };

    legend.addTo(map);
    return () => { legend.remove(); };
  }, [map, counts, total]);

  return null;
}
