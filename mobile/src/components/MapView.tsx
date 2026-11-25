// OpenStreetMap map (Leaflet in a web view): no API key needed, works in Expo Go and the real app.
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius } from '@/theme';
import type { LatLng } from '@/lib/geo';

export interface MapPin { id: string; at: LatLng; label: string; sub?: string; tone?: 'primary' | 'secondary' }
export interface MapLine { points: LatLng[]; labels?: string[] }

/** Renders pins (and an optional route line). Tapping a pin's popup calls onOpen(id). */
export function MapView({ pins, line, onOpen, style }: { pins: MapPin[]; line?: MapLine; onOpen?: (id: string) => void; style?: StyleProp<ViewStyle> }) {
  const html = useMemo(() => {
    const data = JSON.stringify({ pins, line: line ?? null, primary: colors.primary, secondary: colors.secondary });
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#m{height:100%;margin:0;background:#F4EFE6}.leaflet-popup-content{font:14px -apple-system,Roboto,sans-serif;margin:10px 12px}
.leaflet-popup-content b{display:block;font-size:15px}.leaflet-popup-content a{display:inline-block;margin-top:6px;color:${colors.primary};font-weight:600;text-decoration:none}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const D=${data};
const map=L.map('m',{zoomControl:true,attributionControl:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenStreetMap contributors'}).addTo(map);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pts=[];
if(D.line&&D.line.points.length){
  L.polyline(D.line.points,{color:D.primary,weight:4,opacity:.85,dashArray:'6 6'}).addTo(map);
  D.line.points.forEach((p,i)=>{pts.push(p);L.circleMarker(p,{radius:5,color:'#fff',weight:2,fillColor:D.secondary,fillOpacity:1}).addTo(map).bindTooltip(esc((D.line.labels||[])[i]||''),{direction:'top'});});
}
D.pins.forEach(p=>{pts.push(p.at);
  const m=L.circleMarker(p.at,{radius:9,color:'#fff',weight:2,fillColor:p.tone==='secondary'?D.secondary:D.primary,fillOpacity:1}).addTo(map);
  m.bindPopup('<b>'+esc(p.label)+'</b>'+(p.sub?esc(p.sub):'')+'<br><a href="#" onclick="window.ReactNativeWebView.postMessage(\\''+p.id+'\\');return false;">Open ›</a>');
});
if(pts.length===1)map.setView(pts[0],12);else if(pts.length)map.fitBounds(pts,{padding:[30,30]});else map.setView([28.2,84.1],7);
</script></body></html>`;
  }, [pins, line]);

  return (
    <View style={[{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt }, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://mountainplanetnepal.com/' }}
        onMessage={(e) => onOpen?.(e.nativeEvent.data)}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}
