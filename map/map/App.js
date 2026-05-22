import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Switch,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import MapView, {
  Marker,
  Circle,
  Polyline,
  Polygon,
  Callout,
} from "react-native-maps";

// ─────────────────────────────────────────────
//  SIMULATED LOCATION — Islamabad, Pakistan
// ─────────────────────────────────────────────
const BASE_LAT = 33.6844;
const BASE_LON = 73.0479;

function useSimulatedLocation() {
  const [userLocation, setUserLocation] = useState({
    latitude: BASE_LAT,
    longitude: BASE_LON,
  });
  const stepRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      stepRef.current += 1;
      setUserLocation({
        latitude: BASE_LAT + Math.sin(stepRef.current * 0.3) * 0.0008,
        longitude: BASE_LON + Math.cos(stepRef.current * 0.3) * 0.0008,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return userLocation;
}

function generateMockRoute(startLat, startLon) {
  const endLat = startLat + 0.015;
  const endLon = startLon + 0.015;
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * 0.003;
    points.push({
      latitude: startLat + (endLat - startLat) * t + curve,
      longitude: startLon + (endLon - startLon) * t,
    });
  }
  return points;
}

// Pulsing ring animation component
function PulseRing() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "#F59E0B",
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
      }}
    />
  );
}

export default function App() {
  const userLocation = useSimulatedLocation();
  const [routeCoords, setRouteCoords] = useState([]);
  const [showGeofence, setShowGeofence] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showZone, setShowZone] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const panelAnim = useRef(new Animated.Value(1)).current;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRouteCoords(generateMockRoute(BASE_LAT, BASE_LON));
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const togglePanel = () => {
    Animated.spring(panelAnim, {
      toValue: panelOpen ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
    setPanelOpen(!panelOpen);
  };

  const lat = userLocation.latitude;
  const lon = userLocation.longitude;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });

  return (
    <View style={styles.container}>
      {/* ── MAP ── */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: BASE_LAT,
          longitude: BASE_LON,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        mapType="mutedStandard"
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
      >
        {/* LIVE MARKER */}
        <Marker coordinate={{ latitude: lat, longitude: lon }} title="Live Location" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.markerWrap}>
            <PulseRing />
            <View style={styles.markerCore}>
              <View style={styles.markerDot} />
            </View>
          </View>
          <Callout tooltip>
            <View style={styles.calloutBox}>
              <Text style={styles.calloutHeader}>◈ TRACKING UNIT</Text>
              <View style={styles.calloutDivider} />
              <Text style={styles.calloutName}>Talha Ahmad</Text>
              <Text style={styles.calloutId}>FA23-BSE-025</Text>
              <View style={styles.calloutDivider} />
              <Text style={styles.calloutCoord}>LAT  {lat.toFixed(5)}</Text>
              <Text style={styles.calloutCoord}>LON  {lon.toFixed(5)}</Text>
            </View>
          </Callout>
        </Marker>

        {/* GEOFENCE CIRCLE */}
        {showGeofence && routeCoords.length > 0 && (
          <Circle
            center={routeCoords[0]}
            radius={400}
            fillColor="rgba(245,158,11,0.1)"
            strokeColor="#F59E0B"
            strokeWidth={1.5}
          />
        )}

        {/* ROUTE POLYLINE */}
        {showRoute && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#34D399"
            strokeWidth={3}
            lineDashPattern={[8, 4]}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* DESTINATION MARKER */}
        {showRoute && routeCoords.length > 0 && (
          <Marker coordinate={routeCoords[routeCoords.length - 1]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destMarker}>
              <Text style={styles.destIcon}>⌖</Text>
            </View>
          </Marker>
        )}

        {/* RESTRICTED ZONE */}
        {showZone && (
          <Polygon
            coordinates={[
              { latitude: BASE_LAT - 0.002, longitude: BASE_LON - 0.002 },
              { latitude: BASE_LAT - 0.002, longitude: BASE_LON - 0.007 },
              { latitude: BASE_LAT - 0.007, longitude: BASE_LON - 0.007 },
              { latitude: BASE_LAT - 0.007, longitude: BASE_LON - 0.002 },
            ]}
            fillColor="rgba(239,68,68,0.12)"
            strokeColor="#EF4444"
            strokeWidth={1.5}
          />
        )}
      </MapView>

      {/* ── HEADER CARD ── */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>OPERATOR</Text>
          <Text style={styles.headerName}>Talha Ahmad</Text>
          <Text style={styles.headerReg}>FA23-BSE-025</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTime}>{timeStr}</Text>
          <Text style={styles.headerLabel}>LOCAL TIME</Text>
        </View>
      </View>

      {/* ── LIVE PILL ── */}
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* ── SIGNAL BARS (decorative) ── */}
      <View style={styles.signalWrap}>
        {[0.4, 0.6, 0.8, 1].map((h, i) => (
          <View
            key={i}
            style={[styles.signalBar, { height: 10 * h, opacity: i < 3 ? 1 : 0.35 }]}
          />
        ))}
      </View>

      {/* ── COLLAPSE BUTTON ── */}
      <TouchableOpacity style={styles.collapseBtn} onPress={togglePanel} activeOpacity={0.75}>
        <Text style={styles.collapseBtnIcon}>{panelOpen ? "▼" : "▲"}</Text>
      </TouchableOpacity>

      {/* ── DASHBOARD ── */}
      <Animated.View
        style={[
          styles.dashboard,
          {
            transform: [
              {
                translateY: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [260, 0],
                }),
              },
            ],
            opacity: panelAnim,
          },
        ]}
      >
        {/* Top handle */}
        <View style={styles.handle} />

        <Text style={styles.dashTitle}>◈ COMMAND CENTER</Text>

        {/* Coordinate grid */}
        <View style={styles.coordGrid}>
          <View style={styles.coordCell}>
            <Text style={styles.coordLabel}>LATITUDE</Text>
            <Text style={styles.coordValue}>{lat.toFixed(6)}</Text>
          </View>
          <View style={styles.coordSep} />
          <View style={styles.coordCell}>
            <Text style={styles.coordLabel}>LONGITUDE</Text>
            <Text style={styles.coordValue}>{lon.toFixed(6)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Toggles */}
        <TacticalToggle
          label="GEOFENCE PERIMETER"
          badge="GEO"
          badgeColor="#F59E0B"
          value={showGeofence}
          onValueChange={setShowGeofence}
        />
        <TacticalToggle
          label="ACTIVE ROUTE"
          badge="RTE"
          badgeColor="#34D399"
          value={showRoute}
          onValueChange={setShowRoute}
        />
        <TacticalToggle
          label="RESTRICTED ZONE"
          badge="RZN"
          badgeColor="#EF4444"
          value={showZone}
          onValueChange={setShowZone}
        />
      </Animated.View>
    </View>
  );
}

function TacticalToggle({ label, badge, badgeColor, value, onValueChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <View style={[styles.toggleBadge, { backgroundColor: badgeColor + "22", borderColor: badgeColor }]}>
          <Text style={[styles.toggleBadgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#1E293B", true: "#1E3A5F" }}
        thumbColor={value ? "#38BDF8" : "#475569"}
        ios_backgroundColor="#1E293B"
      />
    </View>
  );
}

const PANEL_BG = "#0B1120";
const CARD_BG = "rgba(11,17,32,0.92)";
const ACCENT = "#F59E0B";
const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1120" },
  map: { flex: 1 },

  // ── Marker ──
  markerWrap: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  markerCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(245,158,11,0.2)",
    borderWidth: 2,
    borderColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  markerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F59E0B",
  },

  // ── Destination marker ──
  destMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(52,211,153,0.15)",
    borderWidth: 1.5,
    borderColor: "#34D399",
    justifyContent: "center",
    alignItems: "center",
  },
  destIcon: { color: "#34D399", fontSize: 16, fontWeight: "700" },

  // ── Callout ──
  calloutBox: {
    backgroundColor: "#0B1120",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
    minWidth: 170,
    shadowColor: "#F59E0B",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
  calloutHeader: {
    fontFamily: MONO,
    fontSize: 10,
    color: "#F59E0B",
    letterSpacing: 2,
    marginBottom: 6,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 6,
  },
  calloutName: {
    fontFamily: MONO,
    fontWeight: "700",
    fontSize: 13,
    color: "#F1F5F9",
    marginBottom: 2,
  },
  calloutId: {
    fontFamily: MONO,
    fontSize: 11,
    color: "#94A3B8",
  },
  calloutCoord: {
    fontFamily: MONO,
    fontSize: 10,
    color: "#38BDF8",
    marginTop: 2,
  },

  // ── Header card ──
  headerCard: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 32,
    left: 14,
    right: 14,
    backgroundColor: CARD_BG,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 10,
  },
  headerLeft: { gap: 1 },
  headerLabel: {
    fontFamily: MONO,
    fontSize: 9,
    color: "#475569",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerName: {
    fontFamily: MONO,
    fontWeight: "700",
    fontSize: 14,
    color: "#F1F5F9",
    marginTop: 2,
  },
  headerReg: {
    fontFamily: MONO,
    fontSize: 11,
    color: ACCENT,
    marginTop: 1,
  },
  headerRight: { alignItems: "flex-end" },
  headerTime: {
    fontFamily: MONO,
    fontSize: 18,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 1,
  },

  // ── Live pill ──
  livePill: {
    position: "absolute",
    top: Platform.OS === "ios" ? 104 : 90,
    right: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 5,
  },
  liveText: {
    fontFamily: MONO,
    fontSize: 10,
    fontWeight: "700",
    color: "#22C55E",
    letterSpacing: 2,
  },

  // ── Signal bars ──
  signalWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 110 : 96,
    left: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  signalBar: {
    width: 5,
    backgroundColor: "#38BDF8",
    borderRadius: 2,
  },

  // ── Collapse button ──
  collapseBtn: {
    position: "absolute",
    bottom: 270,
    right: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PANEL_BG,
    borderWidth: 1,
    borderColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 8,
  },
  collapseBtnIcon: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },

  // ── Dashboard ──
  dashboard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PANEL_BG,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 38 : 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: "#1E293B",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#1E293B",
    alignSelf: "center",
    marginBottom: 14,
  },
  dashTitle: {
    fontFamily: MONO,
    fontWeight: "700",
    fontSize: 12,
    color: ACCENT,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 16,
  },

  // ── Coordinate grid ──
  coordGrid: {
    flexDirection: "row",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden",
    marginBottom: 4,
  },
  coordCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  coordSep: {
    width: 1,
    backgroundColor: "#1E293B",
  },
  coordLabel: {
    fontFamily: MONO,
    fontSize: 8,
    color: "#475569",
    letterSpacing: 2,
    marginBottom: 5,
  },
  coordValue: {
    fontFamily: MONO,
    fontSize: 13,
    color: "#38BDF8",
    fontWeight: "700",
  },

  separator: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 14,
  },

  // ── Toggle row ──
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  toggleBadgeText: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  toggleLabel: {
    fontFamily: MONO,
    fontSize: 12,
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
});