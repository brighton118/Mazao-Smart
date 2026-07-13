import os
import json
import time
import random
from datetime import datetime
import pandas as pd
import streamlit as st
import threading
import paho.mqtt.client as mqtt

# ==============================================================================
# PAGE CONFIGURATION
# ==============================================================================
st.set_page_config(
    page_title="AgriSense AI Soil Moisture Telemetry Controller",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded",
)

STATE_FILE = "soil_moisture_sim_state.json"

# ==============================================================================
# MQTT AGRI-SENSE IoT GATEWAY
# ==============================================================================
class AgriSenseMQTTManager:
    def __init__(self):
        self.broker = "broker.hivemq.com"
        self.port = 1883
        self.topic_telemetry = "agrisense/node_wokwi/telemetry"
        self.topic_pump_cmd = "agrisense/node_wokwi/pump"
        
        self.latest_data = None
        self.has_new_data = False
        self.lock = threading.Lock()
        
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        # Start connection in a background thread
        t = threading.Thread(target=self._mqtt_thread, daemon=True)
        t.start()

    def _mqtt_thread(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_forever()
        except Exception as e:
            print(f"MQTT Client loop exception: {e}")

    def on_connect(self, client, userdata, flags, rc):
        print(f"MQTT Gateway connected with result code {rc}")
        self.client.subscribe(self.topic_telemetry)

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode()
            data = json.loads(payload)
            with self.lock:
                self.latest_data = data
                self.has_new_data = True
        except Exception as e:
            print(f"Error parsing MQTT message: {e}")

    def get_latest_telemetry(self):
        with self.lock:
            if self.has_new_data:
                self.has_new_data = False
                return self.latest_data
            return None

    def publish_pump_cmd(self, state):
        cmd = "1" if state else "0"
        try:
            self.client.publish(self.topic_pump_cmd, cmd, qos=1, retain=True)
        except Exception as e:
            print(f"MQTT publish failed: {e}")

@st.cache_resource
def get_mqtt_manager():
    return AgriSenseMQTTManager()

# ==============================================================================
# DEFAULT TELEMETRY SEED DATA
# ==============================================================================
DEFAULT_NODES = [
    {
        "id": "NODE-A1",
        "name": "Node A1 - Coffee North",
        "row": 0,
        "col": 1,
        "moisture": 63.0,
        "temperature": 27.2,
        "depth": 20,
        "crop": "Coffee",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 35.0,
        "target_threshold": 70.0,
        "history": [61.0, 62.0, 61.5, 62.5, 63.0, 63.2, 63.0]
    },
    {
        "id": "NODE-A2",
        "name": "Node A2 - Coffee South",
        "row": 0,
        "col": 2,
        "moisture": 57.0,
        "temperature": 26.8,
        "depth": 40,
        "crop": "Coffee",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 35.0,
        "target_threshold": 70.0,
        "history": [59.0, 58.5, 58.0, 57.5, 57.0, 57.2, 57.0]
    },
    {
        "id": "NODE-B1",
        "name": "Node B1 - Maize West",
        "row": 1,
        "col": 1,
        "moisture": 54.0,
        "temperature": 28.5,
        "depth": 20,
        "crop": "Maize",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 30.0,
        "target_threshold": 65.0,
        "history": [52.0, 52.5, 53.0, 53.5, 54.0, 54.5, 54.0]
    },
    {
        "id": "NODE-B2",
        "name": "Node B2 - Maize East",
        "row": 1,
        "col": 2,
        "moisture": 56.0,
        "temperature": 28.1,
        "depth": 40,
        "crop": "Maize",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 30.0,
        "target_threshold": 65.0,
        "history": [58.0, 57.5, 57.0, 56.5, 56.0, 56.2, 56.0]
    },
    {
        "id": "NODE-C1",
        "name": "Node C1 - Beans Flat",
        "row": 2,
        "col": 0,
        "moisture": 50.0,
        "temperature": 29.0,
        "depth": 30,
        "crop": "Beans",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 30.0,
        "target_threshold": 60.0,
        "history": [48.0, 48.5, 49.0, 49.5, 50.0, 50.2, 50.0]
    },
    {
        "id": "NODE-D1",
        "name": "Node D1 - Matooke Slope",
        "row": 2,
        "col": 3,
        "moisture": 56.0,
        "temperature": 25.5,
        "depth": 30,
        "crop": "Matooke",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 40.0,
        "target_threshold": 75.0,
        "history": [58.0, 57.2, 56.8, 56.0, 55.8, 56.0]
    },
    {
        "id": "NODE-D2",
        "name": "Node D2 - Matooke High",
        "row": 0,
        "col": 3,
        "moisture": 57.0,
        "temperature": 25.8,
        "depth": 30,
        "crop": "Matooke",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 40.0,
        "target_threshold": 75.0,
        "history": [59.0, 58.5, 58.0, 57.5, 57.0, 57.0]
    },
    {
        "id": "NODE-D3",
        "name": "Node D3 - Matooke Valley",
        "row": 2,
        "col": 2,
        "moisture": 56.0,
        "temperature": 26.2,
        "depth": 30,
        "crop": "Matooke",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 40.0,
        "target_threshold": 75.0,
        "history": [54.0, 54.5, 55.0, 55.5, 56.0, 56.2, 56.0]
    },
    {
        "id": "NODE-WOKWI",
        "name": "AgriSense Wokwi IoT Node",
        "row": 1,
        "col": 0,
        "moisture": 50.0,
        "temperature": 24.5,
        "humidity": 60.0,
        "depth": 15,
        "crop": "Maize",
        "mode": "Auto",
        "valve_open": False,
        "critical_threshold": 35.0,
        "target_threshold": 70.0,
        "history": [50.0, 50.0, 50.0, 50.0, 50.0]
    }
]

DEFAULT_LOGS = [
    {"time": "09:30:15", "type": "Info", "message": "LoRa gateway initialized.", "node": "System"},
    {"time": "09:31:02", "type": "Info", "message": "Weather profile calibrated to 'Normal'.", "node": "System"},
    {"time": "09:32:00", "type": "Info", "message": "All 8 active telemetry nodes reporting successfully.", "node": "System"},
]

# ==============================================================================
# STATE PERSISTENCE FUNCTIONS
# ==============================================================================
def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                data = json.load(f)
                # Safeguard: Ensure NODE-WOKWI is present in the loaded nodes list
                if not any(n["id"] == "NODE-WOKWI" for n in data.get("nodes", [])):
                    wokwi_node = next(n for n in DEFAULT_NODES if n["id"] == "NODE-WOKWI")
                    data["nodes"].append(wokwi_node)
                    try:
                        with open(STATE_FILE, "w") as out:
                            json.dump(data, out, indent=2)
                    except Exception:
                        pass
                return data
        except Exception:
            pass
    
    # Initialize default state
    state = {
        "nodes": DEFAULT_NODES,
        "logs": DEFAULT_LOGS,
        "is_playing": True,
        "speed": 3,
        "scenario": "normal",
        "tick_count": 0,
        "selected_node_id": "NODE-A1",
    }
    save_state(state)
    return state

def save_state(state):
    try:
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Error saving state: {e}")

# Initialize state in st.session_state
if "state" not in st.session_state:
    st.session_state.state = load_state()

# Helper for shorter reference
state = st.session_state.state

# ==============================================================================
# MQTT REAL-TIME TELEMETRY INTEGRATION
# ==============================================================================
mqtt_manager = get_mqtt_manager()
latest_iot_telemetry = mqtt_manager.get_latest_telemetry()
if latest_iot_telemetry:
    # Sync to state["nodes"]
    for node in state["nodes"]:
        if node["id"] == "NODE-WOKWI":
            node["moisture"] = latest_iot_telemetry["moisture"]
            node["temperature"] = latest_iot_telemetry["temperature"]
            node["humidity"] = latest_iot_telemetry["humidity"]
            
            # Sync sparkline history list (max 15 data points)
            if "history" not in node:
                node["history"] = []
            node["history"].append(node["moisture"])
            if len(node["history"]) > 15:
                node["history"] = node["history"][-15:]
                
            # AgriSense Automation Logic (Auto-Irrigation loop for IoT Device)
            if node["mode"] == "Auto":
                crit_th = node["critical_threshold"]
                target_th = node["target_threshold"]
                is_valve_open = node["valve_open"]
                
                if node["moisture"] <= crit_th and not is_valve_open:
                    node["valve_open"] = True
                    mqtt_manager.publish_pump_cmd(True)
                    add_log("Action", f"AgriSense IoT Pump TURNED ON (low moisture: {node['moisture']}% <= {crit_th}%)", "NODE-WOKWI")
                elif node["moisture"] >= target_th and is_valve_open:
                    node["valve_open"] = False
                    mqtt_manager.publish_pump_cmd(False)
                    add_log("Action", f"AgriSense IoT Pump TURNED OFF (moisture restored: {node['moisture']}% >= {target_th}%)", "NODE-WOKWI")
            break
    save_state(state)

# ==============================================================================
# SIMULATION ENGINE LOGIC
# ==============================================================================
def add_log(msg_type, message, node_name="System"):
    now = datetime.now().strftime("%H:%M:%S")
    state["logs"].insert(0, {
        "time": now,
        "type": msg_type,
        "message": message,
        "node": node_name
    })
    # Limit logs size
    if len(state["logs"]) > 100:
        state["logs"] = state["logs"][:100]

def run_simulation_tick():
    state["tick_count"] += 1
    scenario = state["scenario"]
    
    # Determine base rate of drying/raining
    # Evaporation dries things out; Rain adds moisture
    if scenario == "drought":
        base_rate = -0.6
        weather_desc = "drought (high transpiration drying)"
    elif scenario == "rain":
        base_rate = 1.0
        weather_desc = "active rainfall (soil wetting)"
    else: # normal
        base_rate = -0.25
        weather_desc = "normal conditions"
        
    for node in state["nodes"]:
        if node["id"] == "NODE-WOKWI":
            continue
        old_moisture = node["moisture"]
        old_valve = node["valve_open"]
        
        # Physics changes
        change = base_rate
        
        # Solenoid valve flow adds water
        if node["valve_open"]:
            change += 2.0  # Valve irrigation rate
            
        # Depth affects rate (deeper soil dries slower and absorbs slower)
        depth_factor = 20.0 / float(node["depth"])
        change = change * depth_factor
        
        # Apply slight random noise
        change += random.uniform(-0.15, 0.15)
        
        # Update moisture within physical bounds
        new_moisture = max(5.0, min(95.0, old_moisture + change))
        node["moisture"] = round(new_moisture, 1)
        
        # Temperature fluctuations based on weather & tick fluctuation
        base_temp = 26.5
        if scenario == "drought":
            base_temp = 31.0
        elif scenario == "rain":
            base_temp = 21.0
            
        noise_temp = random.uniform(-0.2, 0.2)
        node["temperature"] = round(base_temp + (node["depth"] / 80.0) * -2.0 + noise_temp, 1)
        
        # Update history sparkline list (keep last 12 readings)
        if "history" not in node:
            node["history"] = []
        node["history"].append(node["moisture"])
        if len(node["history"]) > 15:
            node["history"] = node["history"][-15:]
            
        # Smart automated rules (Auto-Irrigation Loop)
        if node["mode"] == "Auto":
            crit = node["critical_threshold"]
            tgt = node["target_threshold"]
            
            if node["moisture"] <= crit and not node["valve_open"]:
                node["valve_open"] = True
                add_log("Action", f"Solenoid valve OPENED automatically (low moisture: {node['moisture']}% <= {crit}%)", node["id"])
            elif node["moisture"] >= tgt and node["valve_open"]:
                node["valve_open"] = False
                add_log("Action", f"Solenoid valve CLOSED automatically (moisture restored: {node['moisture']}% >= {tgt}%)", node["id"])
                
        # Trigger warnings for low levels in manual mode too
        if node["moisture"] <= node["critical_threshold"] and old_moisture > node["critical_threshold"]:
            add_log("Alert", f"Moisture level under critical threshold ({node['moisture']}% <= {node['critical_threshold']}%)", node["id"])

    save_state(state)

# ==============================================================================
# CSS GLASSMORPHIC THEME INJECTION
# ==============================================================================
DARK_GREEN_THEME = """
<style>
/* Hide default banners, headers, anchors */
header[data-testid="stHeader"], #MainMenu, footer, .stDeployButton {
    display: none !important;
}

/* Glassmorphic layout wrapper */
div[data-testid="stAppViewContainer"] {
    background: radial-gradient(circle at 50% 50%, #082418, #030e0a) !important;
    background-size: cover;
}

.block-container {
    padding: 1.5rem 3rem 2rem !important;
    max-width: 1400px !important;
}

/* Standard Fonts & Text styling */
h1, h2, h3, p, span, label, div {
    font-family: 'DM Sans', -apple-system, sans-serif !important;
    color: #e2f0e8 !important;
}

/* Glass Container Cards */
.glass-card {
    background: rgba(10, 42, 29, 0.45);
    backdrop-filter: blur(10px) saturate(120%);
    border: 1px solid rgba(22, 101, 52, 0.35);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
}

.glass-card-title {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #8da69c !important;
    margin-bottom: 0.6rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* KPI Card specifics */
.kpi-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    width: 100%;
}

.kpi-card {
    background: rgba(12, 53, 36, 0.55);
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.kpi-label {
    font-size: 0.76rem;
    color: #8da69c !important;
    font-weight: 600;
    text-transform: uppercase;
}

.kpi-value {
    font-size: 1.85rem;
    font-weight: 800;
    color: #ffffff !important;
    margin-top: 2px;
}

/* Indicator Badges */
.badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 600;
}
.badge-green {
    color: #10b981 !important;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
}
.badge-red {
    color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
}
.badge-amber {
    color: #f59e0b !important;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
}
.badge-blue {
    color: #3b82f6 !important;
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Tab Header overriding */
button[data-baseweb="tab"] {
    background: transparent !important;
    color: #8da69c !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    padding: 0.5rem 1.25rem !important;
    border: 1px solid transparent !important;
    border-radius: 6px !important;
}
button[data-baseweb="tab"][aria-selected="true"] {
    color: #ffffff !important;
    background: rgba(22, 101, 52, 0.4) !important;
    border-color: rgba(34, 197, 94, 0.35) !important;
}

/* Custom Table Layout */
.data-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.8rem;
    margin-top: 0.5rem;
}
.data-table th {
    text-align: left;
    padding: 0.6rem 0.8rem;
    color: #8da69c !important;
    font-weight: 600;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid rgba(22, 101, 52, 0.5);
}
.data-table td {
    padding: 0.65rem 0.8rem;
    color: #e2f0e8 !important;
    border-bottom: 1px solid rgba(22, 101, 52, 0.25);
    vertical-align: middle;
}
.data-table tr:hover td {
    background: rgba(22, 101, 52, 0.15);
}

/* Evaporation controls spacer */
[data-testid="stHorizontalBlock"] {
    gap: 1.25rem !important;
}

/* Hover scales on grid */
.grid-cell {
    background: rgba(12, 53, 36, 0.5);
    border: 1px solid rgba(22, 101, 52, 0.4);
    border-radius: 8px;
    padding: 0.6rem;
    text-align: center;
    transition: all 0.2s ease;
}
.grid-cell:hover {
    background: rgba(22, 101, 52, 0.3);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateY(-2px);
}
</style>
"""
st.markdown(DARK_GREEN_THEME, unsafe_allow_html=True)

# ==============================================================================
# HEADER & SPEED TICK ACTIONS
# ==============================================================================
h_left, h_right = st.columns([7, 3])
with h_left:
    st.markdown("""
    <div style="display: flex; align-items: center; gap: 0.8rem;">
        <span style="font-size: 2rem;">🌱</span>
        <div>
            <h2 style="margin:0; font-weight: 800; color: #ffffff !important; letter-spacing: -0.02em;">AgriSense AI</h2>
            <p style="margin:0; font-size: 0.82rem; color: #8da69c !important;">AI-Powered Smart Irrigation System Controller</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

with h_right:
    # Custom status block
    active_scenario = state["scenario"].upper()
    sim_status = "PLAYING" if state["is_playing"] else "PAUSED"
    speed_lbl = f"{state['speed']}x"
    st.markdown(f"""
    <div style="text-align: right; font-size: 0.78rem; color: #8da69c !important; line-height: 1.4;">
        <div><b>Sim Clock Status:</b> <span class="badge badge-{"green" if state["is_playing"] else "amber"}">{sim_status}</span></div>
        <div style="margin-top: 4px;"><b>Mode:</b> {active_scenario} Profile ({speed_lbl})</div>
    </div>
    """, unsafe_allow_html=True)

# Check active logs/alerts count
critical_alerts = sum(1 for n in state["nodes"] if n["moisture"] <= n["critical_threshold"])
active_valves = sum(1 for n in state["nodes"] if n["valve_open"])
avg_moisture = round(sum(n["moisture"] for n in state["nodes"]) / len(state["nodes"]), 1) if state["nodes"] else 0.0

st.markdown("<hr style='border:0; border-top:1px solid rgba(22,101,52,0.3); margin: 0.75rem 0;' />", unsafe_allow_html=True)

# ==============================================================================
# KEY PERFORMANCE INDICATORS ROW
# ==============================================================================
st.markdown(f"""
<div class="kpi-container">
    <div class="kpi-card">
        <span class="kpi-label">Average Field Moisture</span>
        <span class="kpi-value">{avg_moisture}%</span>
        <span style="font-size: 0.72rem; color: #8da69c; margin-top: 2px;">Aggregate over {len(state["nodes"])} sensors</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Active Solenoid Valves</span>
        <span class="kpi-value" style="color: {"#10b981" if active_valves > 0 else "#ffffff"} !important;">{active_valves}</span>
        <span style="font-size: 0.72rem; color: #8da69c; margin-top: 2px;">Irrigating ({len(state["nodes"]) - active_valves} closed)</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">Critical Dry Warnings</span>
        <span class="kpi-value" style="color: {"#ef4444" if critical_alerts > 0 else "#ffffff"} !important;">{critical_alerts}</span>
        <span style="font-size: 0.72rem; color: #8da69c; margin-top: 2px;">Nodes under critical threshold</span>
    </div>
    <div class="kpi-card">
        <span class="kpi-label">AgriSense IoT Gateway</span>
        <span class="kpi-value" style="color: #10b981 !important;">ONLINE</span>
        <span style="font-size: 0.72rem; color: #8da69c; margin-top: 2px;">MQTT Client Loop: Active</span>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown("<div style='margin-bottom:1rem;'></div>", unsafe_allow_html=True)

# ==============================================================================
# SIDEBAR SIMULATION CONTROLS & FORMS
# ==============================================================================
with st.sidebar:
    st.markdown("### ⚙️ Telemetry Controls")
    
    # Play / Pause Simulation
    play_label = "⏸️ Pause Clock" if state["is_playing"] else "▶️ Start Clock"
    if st.button(play_label, use_container_width=True):
        state["is_playing"] = not state["is_playing"]
        add_log("Info", f"Simulation clock {'resumed' if state['is_playing'] else 'paused'}.")
        save_state(state)
        st.rerun()
        
    # Speed selection
    speed_opts = {1: "1x (Normal)", 3: "3x (Medium)", 10: "10x (Accelerated)"}
    # Find current speed index
    curr_speed = state.get("speed", 3)
    sel_speed = st.selectbox(
        "Simulation Speed", 
        options=[1, 3, 10], 
        format_func=lambda x: speed_opts[x],
        index=[1, 3, 10].index(curr_speed)
    )
    if sel_speed != curr_speed:
        state["speed"] = sel_speed
        add_log("Info", f"Simulation speed adjusted to {speed_opts[sel_speed]}.")
        save_state(state)
        st.rerun()

    # Weather scenarios
    curr_scenario = state.get("scenario", "normal")
    scenarios_list = ["normal", "drought", "rain"]
    sel_scenario = st.selectbox(
        "Environmental Scenario",
        options=scenarios_list,
        format_func=lambda x: x.upper(),
        index=scenarios_list.index(curr_scenario)
    )
    if sel_scenario != curr_scenario:
        state["scenario"] = sel_scenario
        add_log("Info", f"Weather scenario changed to custom profile: {sel_scenario.upper()}")
        save_state(state)
        st.rerun()
        
    # Reset simulation
    if st.button("🔄 Reset to Default State", use_container_width=True):
        state["nodes"] = json.loads(json.dumps(DEFAULT_NODES))
        state["logs"] = json.loads(json.dumps(DEFAULT_LOGS))
        state["is_playing"] = True
        state["speed"] = 3
        state["scenario"] = "normal"
        state["tick_count"] = 0
        state["selected_node_id"] = "NODE-A1"
        save_state(state)
        st.toast("Simulation has been reset successfully!", icon="🔄")
        time.sleep(1)
        st.rerun()

    st.markdown("<hr style='border-top:1px solid rgba(22,101,52,0.3);' />", unsafe_allow_html=True)
    st.markdown("### ➕ Register LoRa Node")
    
    with st.form("new_node_form", clear_on_submit=True):
        new_id = st.text_input("Sensor Node ID", value="", placeholder="e.g. NODE-D4")
        new_name = st.text_input("Custom Tag Name", value="", placeholder="e.g. Node D4 - Matooke Pit")
        
        # Grid Coordinates
        rc1, rc2 = st.columns(2)
        with rc1:
            new_row = st.number_input("Grid Row (0-2)", min_value=0, max_value=2, value=0, step=1)
        with rc2:
            new_col = st.number_input("Grid Col (0-3)", min_value=0, max_value=3, value=0, step=1)
            
        new_crop = st.selectbox("Crop Target Type", options=["Maize", "Coffee", "Beans", "Matooke"])
        
        # Physics Parameters
        fc1, fc2 = st.columns(2)
        with fc1:
            new_depth = st.number_input("Sensor Depth (cm)", min_value=10, max_value=60, value=30, step=10)
        with fc2:
            new_moist = st.slider("Init Moisture (%)", min_value=10.0, max_value=90.0, value=50.0)
            
        submitted = st.form_submit_state = st.form_submit_button("Register & Activate Node", use_container_width=True)
        if submitted:
            if not new_id or not new_name:
                st.error("Error: Node ID and Tag Name are required!")
            else:
                # Check duplicates coordinate/id
                id_exists = any(n["id"] == new_id for n in state["nodes"])
                pos_exists = any(n["row"] == new_row and n["col"] == new_col for n in state["nodes"])
                
                if id_exists:
                    st.error(f"Node ID '{new_id}' is already registered.")
                elif pos_exists:
                    st.error(f"Grid coordinate Row {new_row}, Col {new_col} is already occupied.")
                else:
                    # Crop metrics
                    crop_crit_tgt = {
                        "Coffee": (35.0, 70.0),
                        "Maize": (30.0, 65.0),
                        "Beans": (30.0, 60.0),
                        "Matooke": (40.0, 75.0)
                    }
                    crit_th, tgt_th = crop_crit_tgt.get(new_crop, (30.0, 60.0))
                    
                    new_node = {
                        "id": new_id,
                        "name": new_name,
                        "row": int(new_row),
                        "col": int(new_col),
                        "moisture": round(new_moist, 1),
                        "temperature": 26.5,
                        "depth": int(new_depth),
                        "crop": new_crop,
                        "mode": "Auto",
                        "valve_open": False,
                        "critical_threshold": crit_th,
                        "target_threshold": tgt_th,
                        "history": [new_moist] * 6
                    }
                    state["nodes"].append(new_node)
                    state["selected_node_id"] = new_id
                    add_log("Info", f"New LoRa node registered: {new_name} at grid coordinates ({new_row}, {new_col})", new_id)
                    save_state(state)
                    st.toast(f"Registered {new_id} successfully!", icon="✅")
                    time.sleep(1)
                    st.rerun()

# ==============================================================================
# MAIN WORKSPACE TABS
# ==============================================================================
tab_dash, tab_grid, tab_3d, tab_manage, tab_logs = st.tabs([
    "📊 Dashboard Monitoring", 
    "🗺️ Spatial Grid Map", 
    "🌐 3D Simulation Diagram",
    "🔧 Manage Sensors", 
    "📋 Activity Logs & CSV Export"
])


# Find currently selected node dictionary
selected_node = next((n for n in state["nodes"] if n["id"] == state["selected_node_id"]), None)
if not selected_node and state["nodes"]:
    selected_node = state["nodes"][0]
    state["selected_node_id"] = selected_node["id"]

# ==============================================================================
# TAB 1: DASHBOARD MONITORING (Detail & Gauges)
# ==============================================================================
with tab_dash:
    d_left, d_right = st.columns([4, 6])
    
    with d_left:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-title'><span>📡 Selected Sensor Node</span></div>", unsafe_allow_html=True)
        
        if selected_node:
            # Dropdown selector to switch selected node
            node_options = {n["id"]: f"{n['id']} - {n['crop']} ({n['moisture']}%)" for n in state["nodes"]}
            sel_node_id = st.selectbox(
                "Active Monitoring Target",
                options=list(node_options.keys()),
                format_func=lambda x: node_options[x],
                index=list(node_options.keys()).index(state["selected_node_id"])
            )
            if sel_node_id != state["selected_node_id"]:
                state["selected_node_id"] = sel_node_id
                save_state(state)
                st.rerun()
            
            # Interactive controls for this sensor
            st.markdown(f"**Custom Label:** {selected_node['name']}")
            st.markdown(f"**Crop Target:** {selected_node['crop']} | **Depth:** {selected_node['depth']} cm")
            
            # Valve toggle logic
            val_status = "OPEN" if selected_node["valve_open"] else "CLOSED"
            val_badge = f"<span class='badge badge-{'green' if selected_node['valve_open'] else 'red'}'>{val_status}</span>"
            st.markdown(f"**Valve Status:** {val_badge}", unsafe_allow_html=True)
            
            mc1, mc2 = st.columns(2)
            with mc1:
                # Mode selector
                curr_mode = selected_node.get("mode", "Auto")
                sel_mode = st.radio("Irrigation Control Mode", ["Auto", "Manual"], index=0 if curr_mode == "Auto" else 1, key=f"mode_{selected_node['id']}")
                if sel_mode != curr_mode:
                    selected_node["mode"] = sel_mode
                    add_log("Info", f"Changed control mode of {selected_node['id']} to {sel_mode}.", selected_node["id"])
                    save_state(state)
                    st.rerun()
            
            with mc2:
                # Manual valve toggle button
                btn_lbl = "Close Valve Manually" if selected_node["valve_open"] else "Open Valve Manually"
                if st.button(btn_lbl, use_container_width=True, key=f"valve_btn_{selected_node['id']}"):
                    # Toggle valve
                    selected_node["valve_open"] = not selected_node["valve_open"]
                    # Override mode to Manual
                    selected_node["mode"] = "Manual"
                    add_log("Action", f"Solenoid valve toggled to {'OPEN' if selected_node['valve_open'] else 'CLOSED'} (Manual Override)", selected_node["id"])
                    if selected_node["id"] == "NODE-WOKWI":
                        mqtt_manager.publish_pump_cmd(selected_node["valve_open"])
                    save_state(state)
                    st.rerun()
                    
            # Subsurface temperature telemetry
            if "humidity" in selected_node:
                st.markdown(f"**Live IoT Climate Telemetry:** Temp: `{selected_node['temperature']} °C` | Air Humidity: `{selected_node['humidity']}%` (DHT22)")
            else:
                st.markdown(f"**Subsurface Soil Temp:** `{selected_node['temperature']} °C`")
            
            # Render SVG Circular Gauge for Moisture
            moist_val = selected_node["moisture"]
            crit_val = selected_node["critical_threshold"]
            
            # Determine color index
            if moist_val <= crit_val:
                color_hex = "#ef4444" # red
                label_status = "CRITICAL (SOIL DRY)"
                gauge_bg = "rgba(239, 68, 68, 0.1)"
            elif moist_val <= crit_val + 10:
                color_hex = "#f59e0b" # amber
                label_status = "ALERT (LOW MOISTURE)"
                gauge_bg = "rgba(245, 158, 11, 0.1)"
            else:
                color_hex = "#10b981" # emerald
                label_status = "HEALTHY"
                gauge_bg = "rgba(16, 185, 129, 0.1)"
                
            stroke_dash = int(2.0 * 3.14159 * 40 * (moist_val / 100.0))
            stroke_dash_full = int(2.0 * 3.14159 * 40)
            
            svg_gauge = f"""
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 1.5rem;">
                <svg width="180" height="180" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(22, 101, 52, 0.2)" stroke-width="8" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke="{color_hex}" stroke-width="8" fill="none"
                            stroke-dasharray="{stroke_dash} {stroke_dash_full}" transform="rotate(-90 50 50)" stroke-linecap="round" />
                    <text x="50" y="55" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="900" fill="#ffffff" text-anchor="middle">{moist_val}%</text>
                </svg>
                <div style="font-weight: 700; font-size: 0.82rem; color: {color_hex}; margin-top: 0.5rem; text-transform: uppercase;">
                    {label_status}
                </div>
            </div>
            """
            st.markdown(svg_gauge, unsafe_allow_html=True)
            
            # Historical Telemetry Sparkline
            history_pts = selected_node.get("history", [moist_val] * 6)
            if history_pts:
                # Draw responsive line sparklines using SVG
                w_svg = 350
                h_svg = 70
                padding = 10
                
                x_step = (w_svg - 2 * padding) / max(1, len(history_pts) - 1)
                
                # Math coordinate translation
                # y spans from 0 (healthy) to 100 (saturated)
                points_str = []
                for idx, pt in enumerate(history_pts):
                    cx = padding + idx * x_step
                    cy = h_svg - padding - ((pt / 100.0) * (h_svg - 2 * padding))
                    points_str.append(f"{cx},{cy}")
                    
                line_points = " ".join(points_str)
                
                svg_sparkline = f"""
                <div style="margin-top: 1.5rem; text-align: center;">
                    <div style="font-size: 0.72rem; color: #8da69c; font-weight: 600; text-transform: uppercase; margin-bottom: 0.4rem;">
                        Moisture Telemetry (Recent 15 Ticks)
                    </div>
                    <svg width="{w_svg}" height="{h_svg}" style="background: rgba(12, 53, 36, 0.4); border-radius: 6px; border: 1px dashed rgba(22, 101, 52, 0.4);">
                        <polyline fill="none" stroke="{color_hex}" stroke-width="2.5" points="{line_points}" stroke-linecap="round" stroke-linejoin="round" />
                        <!-- horizontal bounds -->
                        <line x1="0" y1="{h_svg - padding - (crit_val/100)*(h_svg - 2*padding)}" x2="{w_svg}" y2="{h_svg - padding - (crit_val/100)*(h_svg - 2*padding)}" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1" stroke-dasharray="4,4" />
                    </svg>
                    <div style="display: flex; justify-content: space-between; padding: 0 10px; font-size: 0.65rem; color: #8da69c;">
                        <span>Previous Ticks</span>
                        <span style="color: rgba(239, 68, 68, 0.75);">Threshold: {crit_val}%</span>
                        <span>Latest: {moist_val}%</span>
                    </div>
                </div>
                """
                st.markdown(svg_sparkline, unsafe_allow_html=True)
        else:
            st.warning("No sensor nodes available. Add nodes in the sidebar or reset simulation.")
            
        st.markdown("</div>", unsafe_allow_html=True)
        
    with d_right:
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        st.markdown("<div class='glass-card-title'><span>📈 Active Node List ({avg_moisture}% Avg Moisture)</span></div>", unsafe_allow_html=True)
        
        # Display list of all nodes with inline status and select actions
        for row_idx, node in enumerate(state["nodes"]):
            m_val = node["moisture"]
            c_val = node["critical_threshold"]
            
            # Status tag
            if m_val <= c_val:
                status_color = "red"
                status_txt = "Critical"
            elif m_val <= c_val + 10:
                status_color = "amber"
                status_txt = "Low"
            else:
                status_color = "green"
                status_txt = "Healthy"
                
            val_stat = "Irrigating" if node["valve_open"] else "Inactive"
            mode_lbl = node.get("mode", "Auto")
            
            # Render details structure
            col1, col2, col3, col4 = st.columns([4, 2, 2, 2])
            with col1:
                st.markdown(f"**{node['id']} - {node.get('name', 'Sensor')}**<br/><span style='font-size:0.75rem; color: #8da69c;'>Crop: {node['crop']} | Depth: {node['depth']}cm</span>", unsafe_allow_html=True)
            with col2:
                # mini status representation
                st.markdown(f"<span class='badge badge-{status_color}'>{m_val}% {status_txt}</span>", unsafe_allow_html=True)
            with col3:
                val_color = "green" if node["valve_open"] else "blue"
                st.markdown(f"<span class='badge badge-{val_color}'>{val_stat} ({mode_lbl})</span>", unsafe_allow_html=True)
            with col4:
                # inspect button
                if st.button("Inspect Node", key=f"inspect_{node['id']}", use_container_width=True):
                    state["selected_node_id"] = node["id"]
                    save_state(state)
                    st.rerun()
            st.markdown("<hr style='border-top:1px solid rgba(22,101,52,0.15); margin: 0.5rem 0;' />", unsafe_allow_html=True)
            
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# TAB 2: SPATIAL GRID MAP (Visual coords)
# ==============================================================================
with tab_grid:
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card-title' style='justify-content: center; font-size: 1.1rem; color: #ffffff !important;'>🧭 FIELD MAPPING - GRID NORTH ALIGNMENT</div>", unsafe_allow_html=True)
    
    # Render a 4x3 spatial map coordinates
    # Rows 0-2, Columns 0-3
    for r in range(3):
        cols = st.columns(4)
        for c in range(4):
            with cols[c]:
                # Find if any node is at (r, c)
                node_in_cell = next((n for n in state["nodes"] if n["row"] == r and n["col"] == c), None)
                
                if node_in_cell:
                    m = node_in_cell["moisture"]
                    tc = node_in_cell["temperature"]
                    cr = node_in_cell["critical_threshold"]
                    
                    # Status color
                    if m <= cr:
                        bg_style = "background: rgba(239, 68, 68, 0.17); border: 2px solid #ef4444;"
                        badge_color = "red"
                    elif m <= cr + 10:
                        bg_style = "background: rgba(245, 158, 11, 0.17); border: 2px solid #f59e0b;"
                        badge_color = "amber"
                    else:
                        bg_style = "background: rgba(16, 185, 129, 0.17); border: 2px solid #10b981;"
                        badge_color = "green"
                        
                    is_active = " (Active)" if state["selected_node_id"] == node_in_cell["id"] else ""
                    html_cell = f"""
                    <div style="border-radius: 8px; padding: 0.75rem; text-align: center; margin-bottom: 0.75rem; {bg_style}">
                        <div style="font-weight: 800; font-size: 0.85rem; color: #ffffff !important;">{node_in_cell["id"]}{is_active}</div>
                        <div style="font-size: 0.72rem; color: #8da69c; margin-top:2px;">{node_in_cell["crop"]} | Depth: {node_in_cell["depth"]}cm</div>
                        <div style="font-size: 0.8rem; font-weight: 700; margin-top: 5px;">Moisture: {m}%</div>
                        <div style="font-size: 0.72rem; color: #8da69c;">Temp: {tc}°C</div>
                        <div style="margin-top: 6px;">
                            <span class="badge badge-{"green" if node_in_cell["valve_open"] else "red"}" style="font-size:0.65rem;">
                                Valve: {"OPEN" if node_in_cell["valve_open"] else "CLOSED"}
                            </span>
                        </div>
                    </div>
                    """
                    st.markdown(html_cell, unsafe_allow_html=True)
                    # Inspect button inside cell
                    if st.button("Select Node", key=f"grid_sel_{r}_{c}", use_container_width=True):
                        state["selected_node_id"] = node_in_cell["id"]
                        save_state(state)
                        st.rerun()
                else:
                    # Empty cell
                    st.markdown(f"""
                    <div style="background: rgba(22, 101, 52, 0.05); border: 1px dashed rgba(22, 101, 52, 0.25); border-radius: 8px; padding: 1.55rem; text-align: center; color: rgba(141,166,156,0.3) !important; font-size: 0.72rem; margin-bottom: 0.75rem;">
                        Empty Coordinate Slot<br/>[Row {r}, Col {c}]
                    </div>
                    """, unsafe_allow_html=True)
                    st.markdown("<div style='height: 38px;'></div>", unsafe_allow_html=True) # visual spacer matching button heights
                    
    st.markdown("</div>", unsafe_allow_html=True)


# ==============================================================================
# TAB 3: 3D SIMULATION DIAGRAM
# ==============================================================================
with tab_3d:
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card-title'><span>🌐 Interactive 3D IoT Hardware Simulation</span></div>", unsafe_allow_html=True)
    
    if selected_node:
        node_id = selected_node["id"]
        node_crop = selected_node["crop"]
        node_mode = selected_node.get("mode", "Auto")
        moisture = selected_node["moisture"]
        temp = selected_node["temperature"]
        humidity = selected_node.get("humidity", 60.0)
        valve_open = selected_node.get("valve_open", False)
        crit_th = selected_node.get("critical_threshold", 30.0)
        tgt_th = selected_node.get("target_threshold", 65.0)
        
        moist_color = "#e05a4e" if moisture <= crit_th else ("#e8a042" if moisture < tgt_th else "#4caf7d")
        valve_badge_text = "OPEN (DRIPPING)" if valve_open else "CLOSED (IDLE)"
        valve_badge_class = "badge-green" if valve_open else "badge-blue"
        valve_open_js = "true" if valve_open else "false"
        is_greenhouse_js = "true" if selected_node.get("crop", "Maize") in ["Coffee", "Matooke"] else "false"
        
        three_js_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ margin: 0; overflow: hidden; background-color: #0c1e13; font-family: sans-serif; color: #f5efe6; }}
                #canvas-container {{ width: 100vw; height: 100vh; position: relative; }}
                .hud-card {{ position: absolute; background: rgba(12, 53, 36, 0.75); border: 1px solid rgba(76, 175, 125, 0.25); backdrop-filter: blur(10px); border-radius: 10px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); pointer-events: none; }}
                #hud-top-left {{ top: 15px; left: 15px; width: 240px; }}
                #hud-top-right {{ top: 15px; right: 15px; width: 220px; }}
                #hud-bottom {{ bottom: 15px; left: 50%; transform: translateX(-50%); text-align: center; font-size: 10px; color: #8aab90; padding: 6px 16px; background: rgba(12,53,36,0.6); border-radius: 15px; border: 1px solid rgba(76,175,125,0.15); }}
                .hud-title {{ font-size: 9px; color: #e8a042; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }}
                .hud-heading {{ font-size: 15px; font-weight: 700; margin: 0 0 8px 0; color: #ffffff; }}
                .hud-metric {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; }}
                .hud-val {{ font-family: monospace; font-weight: 700; }}
                .progress-bar-container {{ width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px; height: 5px; overflow: hidden; margin: 2px 0 8px 0; }}
                .progress-bar {{ height: 100%; transition: width 0.4s; }}
                .badge {{ padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; }}
                .badge-green {{ background: rgba(76,175,125,0.25); color: #4caf7d; border: 1px solid rgba(76,175,125,0.4); }}
                .badge-blue {{ background: rgba(59,130,246,0.25); color: #3b82f6; border: 1px solid rgba(59,130,246,0.4); }}
                .online-dot {{ width: 7px; height: 7px; background-color: #4caf7d; border-radius: 50%; display: inline-block; margin-right: 5px; animation: pulse 1.5s infinite; }}
                @keyframes pulse {{ 0%, 100% {{ transform: scale(0.9); opacity: 0.7; }} 50% {{ transform: scale(1.2); opacity: 1; }} }}
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
        </head>
        <body>
            <div id="canvas-container">
                <div id="hud-top-left" class="hud-card">
                    <div class="hud-title">ACTIVE MONITORING TARGET</div>
                    <div class="hud-heading">{node_id} ({node_crop})</div>
                    <div style="display:flex; align-items:center; margin-bottom:8px;">
                        <span class="online-dot"></span>
                        <span style="font-size:10px; color:#8aab90;">CONNECTED · LoRa AgriMesh</span>
                    </div>
                    <div class="hud-metric">
                        <span style="color:#c8c0b0;">Target Zone</span>
                        <span class="hud-val" style="color:#e8a042;">{"Greenhouse" if is_greenhouse_js == "true" else "Outfield Garden"}</span>
                    </div>
                    <div class="hud-metric">
                        <span style="color:#c8c0b0;">Control Mode</span>
                        <span class="hud-val" style="color:#ffffff;">{node_mode}</span>
                    </div>
                    <div class="hud-metric" style="margin-top:6px;">
                        <span style="color:#c8c0b0;">Irrigation Valve</span>
                        <span class="badge {valve_badge_class}">{valve_badge_text}</span>
                    </div>
                </div>

                <div id="hud-top-right" class="hud-card">
                    <div class="hud-title">LIVE ZONE STATE</div>
                    <div class="hud-metric" style="margin-bottom:2px;">
                        <span>Soil Moisture</span>
                        <span class="hud-val" style="color:#4caf7d;">{moisture}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width:{moisture}%; background:{moist_color};"></div>
                    </div>
                    <div class="hud-metric">
                        <span>Temperature</span>
                        <span class="hud-val" style="color:#e8a042;">{temp} °C</span>
                    </div>
                    <div class="hud-metric">
                        <span>Air Humidity</span>
                        <span class="hud-val" style="color:#a78bfa;">{humidity}%</span>
                    </div>
                </div>
                <div id="hud-bottom">
                    🖱️ Left-Click + Drag: Rotate Farm Scene | Scroll: Zoom | Solar, Power, Pipes & Data Flow Active
                </div>
            </div>

            <script>
                const moisture = {moisture};
                const valveOpen = {valve_open_js};
                const isGreenhouse = {is_greenhouse_js};
                
                const scene = new THREE.Scene();
                scene.background = new THREE.Color(0x0a140d);
                scene.fog = new THREE.FogExp2(0x0a140d, 0.04);

                const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
                
                const camX = localStorage.getItem('agrisense_cam_x2');
                const camY = localStorage.getItem('agrisense_cam_y2');
                const camZ = localStorage.getItem('agrisense_cam_z2');
                if (camX && camY && camZ) {{
                    camera.position.set(parseFloat(camX), parseFloat(camY), parseFloat(camZ));
                }} else {{
                    camera.position.set(8, 7, 10);
                }}

                const renderer = new THREE.WebGLRenderer({{ antialias: true }});
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.shadowMap.enabled = true;
                document.getElementById('canvas-container').appendChild(renderer.domElement);

                const controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.maxPolarAngle = Math.PI / 2 - 0.05;
                controls.minDistance = 3;
                controls.maxDistance = 25;
                controls.target.set(0, 0.5, 0);
                controls.update();

                controls.addEventListener('change', () => {{
                    localStorage.setItem('agrisense_cam_x2', camera.position.x);
                    localStorage.setItem('agrisense_cam_y2', camera.position.y);
                    localStorage.setItem('agrisense_cam_z2', camera.position.z);
                }});

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
                scene.add(ambientLight);

                const dirLight = new THREE.DirectionalLight(0xfff5ea, 0.9);
                dirLight.position.set(10, 15, 5);
                dirLight.castShadow = true;
                scene.add(dirLight);

                const modelGroup = new THREE.Group();
                scene.add(modelGroup);

                // Colors
                const dryColor = new THREE.Color(0x8a715f);
                const wetColor = new THREE.Color(0x23160e);
                const activeSoilColor = dryColor.clone().lerp(wetColor, moisture / 100.0);
                const defaultSoilColor = new THREE.Color(0x4a3a2e); // Static normal moisture

                // Terrain grass base
                const groundMat = new THREE.MeshStandardMaterial({{ color: 0x1a3d24, roughness: 0.9 }});
                const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), groundMat);
                ground.position.y = -0.1;
                ground.receiveShadow = true;
                modelGroup.add(ground);

                // 2 Zone Soil Beds
                const ghSoilMat = new THREE.MeshStandardMaterial({{ color: isGreenhouse ? activeSoilColor : defaultSoilColor, roughness: 0.95 }});
                const ghSoil = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 4.8), ghSoilMat);
                ghSoil.position.set(-2.5, 0.1, 0.5);
                ghSoil.receiveShadow = true;
                modelGroup.add(ghSoil);

                const ofSoilMat = new THREE.MeshStandardMaterial({{ color: !isGreenhouse ? activeSoilColor : defaultSoilColor, roughness: 0.95 }});
                const ofSoil = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 4.8), ofSoilMat);
                ofSoil.position.set(2.5, 0.1, 0.5);
                ofSoil.receiveShadow = true;
                modelGroup.add(ofSoil);

                // Greenhouse enclosing glass & frames
                const ghGlassMat = new THREE.MeshStandardMaterial({{
                    color: 0xa5f3fc,
                    transparent: true,
                    opacity: 0.12,
                    roughness: 0.1,
                    metalness: 0.1,
                    side: THREE.DoubleSide
                }});
                const ghStructure = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 5.0), ghGlassMat);
                ghStructure.position.set(-2.5, 0.9, 0.5);
                modelGroup.add(ghStructure);

                // Greenhouse steel frame lines
                const edges = new THREE.EdgesGeometry(ghStructure.geometry);
                const frameLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({{ color: 0x475569, linewidth: 2 }}));
                frameLine.position.set(-2.5, 0.9, 0.5);
                modelGroup.add(frameLine);

                // Greenhouse roof arches
                const roofGeom = new THREE.CylinderGeometry(1.9, 1.9, 5.0, 10, 1, false, 0, Math.PI);
                const roof = new THREE.Mesh(roofGeom, ghGlassMat);
                roof.rotation.x = Math.PI / 2;
                roof.position.set(-2.5, 1.8, 0.5);
                modelGroup.add(roof);
                const roofEdges = new THREE.EdgesGeometry(roofGeom);
                const roofFrames = new THREE.LineSegments(roofEdges, new THREE.LineBasicMaterial({{ color: 0x475569 }}));
                roofFrames.rotation.x = Math.PI / 2;
                roofFrames.position.set(-2.5, 1.8, 0.5);
                modelGroup.add(roofFrames);

                // Server House (Control Brain)
                const serverBg = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.6), new THREE.MeshStandardMaterial({{ color: 0x334155, roughness: 0.8 }}));
                serverBg.position.set(-2.8, 0.6, -2.8);
                serverBg.castShadow = true;
                modelGroup.add(serverBg);

                const serverRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.8), new THREE.MeshStandardMaterial({{ color: 0x1e293b }}));
                serverRoof.position.set(-2.8, 1.25, -2.8);
                modelGroup.add(serverRoof);

                // Server Status Console Glow
                const consoleLed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), new THREE.MeshBasicMaterial({{ color: 0x0ea5e9 }}));
                consoleLed.position.set(-2.2, 0.7, -1.98);
                modelGroup.add(consoleLed);

                // Solar Panels on server roof
                const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1.0), new THREE.MeshStandardMaterial({{ color: 0x1e3a8a, metalness: 0.8, roughness: 0.1 }}));
                solarPanel.rotation.x = -Math.PI / 8;
                solarPanel.position.set(-2.8, 1.45, -2.7);
                modelGroup.add(solarPanel);

                // Solar Stand
                const solarStand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4), new THREE.MeshStandardMaterial({{ color: 0x64748b }}));
                solarStand.position.set(-2.8, 1.35, -2.7);
                modelGroup.add(solarStand);

                // Water Storage Tank (Metallic Cylinder on Stand)
                const tankStand = new THREE.Group();
                for (let i = -1; i <= 1; i += 2) {{
                    for (let j = -1; j <= 1; j += 2) {{
                        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), new THREE.MeshStandardMaterial({{ color: 0x64748b, metalness: 0.5 }}));
                        leg.position.set(2.8 + i * 0.4, 0.6, -2.8 + j * 0.4);
                        tankStand.add(leg);
                    }}
                }}
                modelGroup.add(tankStand);

                const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.6, 16), new THREE.MeshStandardMaterial({{ color: 0x475569, metalness: 0.7, roughness: 0.3 }}));
                waterTank.position.set(2.8, 1.7, -2.8);
                waterTank.castShadow = true;
                modelGroup.add(waterTank);

                // Water Tank Capacity visual ring
                const tankCap = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.03, 8, 24), new THREE.MeshBasicMaterial({{ color: 0x3b82f6 }}));
                tankCap.rotation.x = Math.PI / 2;
                tankCap.position.set(2.8, 2.0, -2.8);
                modelGroup.add(tankCap);

                // Water Pipelines Network
                const pipeMat = new THREE.MeshStandardMaterial({{ color: 0x1e293b, roughness: 0.5 }});
                
                // Vertical pipe from tank
                const mainDownPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2), pipeMat);
                mainDownPipe.position.set(2.8, 0.6, -2.8);
                modelGroup.add(mainDownPipe);

                // Main conduit forward
                const forwardPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4), pipeMat);
                forwardPipe.rotation.x = Math.PI / 2;
                forwardPipe.position.set(2.8, 0.15, -1.6);
                modelGroup.add(forwardPipe);

                // Split pipe left (cross terrain)
                const splitPipeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.6), pipeMat);
                splitPipeLeft.rotation.z = Math.PI / 2;
                splitPipeLeft.position.set(0, 0.15, -0.4);
                modelGroup.add(splitPipeLeft);

                // Elevated emitter pipe in Greenhouse
                const ghPipeHeight = 1.0;
                const ghUpPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ghPipeHeight), pipeMat);
                ghUpPipe.position.set(-2.5, 0.15 + ghPipeHeight/2, -0.4);
                modelGroup.add(ghUpPipe);

                const ghEmitterPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.8), pipeMat);
                ghEmitterPipe.rotation.x = Math.PI / 2;
                ghEmitterPipe.position.set(-2.5, 0.15 + ghPipeHeight, 0.5);
                modelGroup.add(ghEmitterPipe);

                // Elevated emitter pipe in Outfield
                const ofPipeHeight = 0.8;
                const ofUpPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ofPipeHeight), pipeMat);
                ofUpPipe.position.set(2.5, 0.15 + ofPipeHeight/2, -0.4);
                modelGroup.add(ofUpPipe);

                const ofEmitterPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.8), pipeMat);
                ofEmitterPipe.rotation.x = Math.PI / 2;
                ofEmitterPipe.position.set(2.5, 0.15 + ofPipeHeight, 0.5);
                modelGroup.add(ofEmitterPipe);

                // Plants
                const leafMat = new THREE.MeshStandardMaterial({{ color: 0x15803d, roughness: 0.6 }});
                const stalkMat = new THREE.MeshStandardMaterial({{ color: 0x166534 }});
                
                // Greenhouse Coffee/Matooke Plants
                const ghPlantGroup = new THREE.Group();
                for (let z = -1.2; z <= 1.8; z += 1.0) {{
                    const plant = new THREE.Group();
                    plant.position.set(-2.5, 0.2, z);
                    
                    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.4), stalkMat);
                    stalk.position.y = 0.2;
                    plant.add(stalk);
                    
                    const leafGeo = new THREE.SphereGeometry(0.12, 6, 6);
                    leafGeo.scale(1.8, 0.2, 0.7);
                    for (let l = 0; l < 4; l++) {{
                        const leaf = new THREE.Mesh(leafGeo, leafMat);
                        leaf.position.set(0, 0.35, 0);
                        leaf.rotation.y = (Math.PI / 2) * l + Math.random()*0.2;
                        leaf.rotation.z = 0.3;
                        plant.add(leaf);
                    }}
                    ghPlantGroup.add(plant);
                }}
                modelGroup.add(ghPlantGroup);

                // Outfield Maize Plants
                const ofPlantGroup = new THREE.Group();
                const maizeStalkMat = new THREE.MeshStandardMaterial({{ color: 0x4d7c0f }});
                const cobMat = new THREE.MeshStandardMaterial({{ color: 0xfacc15 }});
                for (let xOffset = -0.5; xOffset <= 0.5; xOffset += 1.0) {{
                    for (let z = -1.2; z <= 1.8; z += 1.0) {{
                        const plant = new THREE.Group();
                        plant.position.set(2.5 + xOffset, 0.2, z + Math.random()*0.1);
                        
                        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.65), maizeStalkMat);
                        stalk.position.y = 0.325;
                        plant.add(stalk);

                        const leafCone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 5), maizeStalkMat);
                        leafCone.position.set(0, 0.55, 0);
                        leafCone.rotation.x = 0.2;
                        plant.add(leafCone);

                        const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6), cobMat);
                        cob.position.set(0.04, 0.35, 0.04);
                        cob.rotation.z = 0.5;
                        plant.add(cob);

                        ofPlantGroup.add(plant);
                    }}
                }}
                modelGroup.add(ofPlantGroup);

                // Visible Moisture Sensor Stakes
                const sensStakeMat = new THREE.MeshStandardMaterial({{ color: 0x0f172a, metalness: 0.9, roughness: 0.2 }});
                const sensStakeGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);

                // Greenhouse Probe
                const ghStake = new THREE.Mesh(sensStakeGeo, sensStakeMat);
                ghStake.position.set(-2.5, 0.3, 1.8);
                modelGroup.add(ghStake);
                
                const ghLed = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({{
                    color: isGreenhouse ? new THREE.Color('{moist_color}') : 0x22c55e
                }}));
                ghLed.position.set(-2.5, 0.58, 1.8);
                modelGroup.add(ghLed);

                // Outfield Probe
                const ofStake = new THREE.Mesh(sensStakeGeo, sensStakeMat);
                ofStake.position.set(2.5, 0.3, 1.8);
                modelGroup.add(ofStake);
                
                const ofLed = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({{
                    color: !isGreenhouse ? new THREE.Color('{moist_color}') : 0x22c55e
                }}));
                ofLed.position.set(2.5, 0.58, 1.8);
                modelGroup.add(ofLed);

                // 2 sets of signal conduits
                function createWirePath(pts, color) {{
                    const material = new THREE.LineBasicMaterial({{ color: color }});
                    const points = [];
                    pts.forEach(p => points.push(new THREE.Vector3(p[0], p[1], p[2])));
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, material);
                    modelGroup.add(line);
                }}

                // Wire paths coordinates
                const solarToHousePts = [ [-2.8, 1.4, -2.7], [-2.8, 1.2, -2.7], [-2.0, 0.8, -2.7] ];
                createWirePath(solarToHousePts, 0xf59e0b); // Golden wire

                const ghSensorWirePts = [ [-2.5, 0.58, 1.8], [-2.5, 0.15, 1.8], [-2.5, 0.15, -0.4], [-2.0, 0.5, -2.0] ];
                createWirePath(ghSensorWirePts, 0x10b981); // Emerald telemetry wire

                const ofSensorWirePts = [ [2.5, 0.58, 1.8], [2.5, 0.15, 1.8], [2.5, 0.15, -0.4], [-2.0, 0.4, -2.0] ];
                createWirePath(ofSensorWirePts, 0x10b981);

                // System Architecture Control and Power Wires
                // Server to Relay: violet pulse wire representing ESP32 control signal output to the physical relay module
                const serverToRelayWirePts = [ [-2.0, 0.5, -2.5], [-2.0, 0.1, -2.5], [2.3, 0.1, -2.5], [2.3, 0.15, -2.4] ];
                createWirePath(serverToRelayWirePts, 0x8b5cf6); // Purple wire

                // Relay to Pump: black high-voltage output cable
                const relayToPumpWirePts = [ [2.3, 0.2, -2.4], [2.8, 0.2, -2.4] ];
                createWirePath(relayToPumpWirePts, 0x1e293b); // Black wire

                // Water Pump Integration
                const pumpGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12);
                const pumpMat = new THREE.MeshStandardMaterial({{ color: 0x0f766e, metalness: 0.7, roughness: 0.2 }});
                const pump = new THREE.Mesh(pumpGeo, pumpMat);
                pump.rotation.x = Math.PI / 2;
                pump.position.set(2.8, 0.2, -2.4);
                pump.castShadow = true;
                modelGroup.add(pump);

                const pumpBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.25), new THREE.MeshStandardMaterial({{ color: 0x334155 }}));
                pumpBase.position.set(2.8, 0.04, -2.4);
                modelGroup.add(pumpBase);

                const pumpLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), new THREE.MeshBasicMaterial({{ color: 0xef4444 }}));
                pumpLed.position.set(2.8, 0.33, -2.4);
                modelGroup.add(pumpLed);

                // Electronic Relay Controller
                const relayMat = new THREE.MeshStandardMaterial({{ color: 0x166534, roughness: 0.8 }});
                const relay = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.28), relayMat);
                relay.position.set(2.3, 0.13, -2.4);
                modelGroup.add(relay);

                const relaySwitch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), new THREE.MeshStandardMaterial({{ color: 0x2563eb, roughness: 0.5 }}));
                relaySwitch.position.set(2.3, 0.20, -2.4);
                modelGroup.add(relaySwitch);

                // Drip Particles Setup
                const drops = [];
                const maxDrops = 16;
                const dropGeo = new THREE.SphereGeometry(0.02, 4, 4);
                const dropMat = new THREE.MeshBasicMaterial({{ color: 0x3b82f6 }});

                for (let i = 0; i < maxDrops; i++) {{
                    const d = new THREE.Mesh(dropGeo, dropMat);
                    d.visible = false;
                    d.velocity = -0.06 - Math.random() * 0.05;
                    d.age = -i * 5;
                    modelGroup.add(d);
                    drops.push(d);
                }}

                // Flow indicators along pipes (tiny moving spheres)
                const flowIndicator = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({{ color: 0x3b82f6 }}));
                modelGroup.add(flowIndicator);
                let flowT = 0;

                // Power pulse indicators
                const pwrPulse = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({{ color: 0xf59e0b }}));
                modelGroup.add(pwrPulse);
                let pwrT = 0;

                // Telemetry data packet indicators
                const telPulse = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({{ color: 0x10b981 }}));
                modelGroup.add(telPulse);
                let telT = 0;

                // Control wire pulse indicator
                const ctrlPulse = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({{ color: 0x8b5cf6 }}));
                modelGroup.add(ctrlPulse);
                let ctrlT = 0;

                const clock = new THREE.Clock();
                let lastBlink = 0;
                let lastPwrUpdate = 0;

                function getPointOnLine(pts, t) {{
                    const numSegments = pts.length - 1;
                    const segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
                    const rem = (t * numSegments) - segment;
                    const p1 = new THREE.Vector3(pts[segment][0], pts[segment][1], pts[segment][2]);
                    const p2 = new THREE.Vector3(pts[segment+1][0], pts[segment+1][1], pts[segment+1][2]);
                    return new THREE.Vector3().lerpVectors(p1, p2, rem);
                }}

                function animate() {{
                    requestAnimationFrame(animate);
                    const delta = clock.getDelta();
                    const elapsed = clock.getElapsedTime();
                    
                    controls.update();

                    // Slow scene rotation
                    modelGroup.rotation.y = elapsed * 0.04;

                    // Blinking systems
                    if (elapsed - lastBlink > 0.4) {{
                        consoleLed.visible = !consoleLed.visible;
                        ghLed.material.color = isGreenhouse && moisture <= {crit_th} 
                            ? (consoleLed.visible ? new THREE.Color(0xef4444) : new THREE.Color(0x7f1d1d)) 
                            : new THREE.Color(ghLed.material.color);
                        ofLed.material.color = !isGreenhouse && moisture <= {crit_th} 
                            ? (consoleLed.visible ? new THREE.Color(0xef4444) : new THREE.Color(0x7f1d1d)) 
                            : new THREE.Color(ofLed.material.color);
                        lastBlink = elapsed;
                    }}

                    // Power pulse animations (Solar Panel -> Server)
                    pwrT += 0.8 * delta;
                    if (pwrT > 1) pwrT = 0;
                    pwrPulse.position.copy(getPointOnLine(solarToHousePts, pwrT));

                    // Telemetry data packet pulses (Sensor -> Server)
                    telT += 0.4 * delta;
                    if (telT > 1) telT = 0;
                    if (isGreenhouse) {{
                        telPulse.position.copy(getPointOnLine(ghSensorWirePts, telT));
                    }} else {{
                        telPulse.position.copy(getPointOnLine(ofSensorWirePts, telT));
                    }}

                    // Pump and Relay visual state updates
                    if (valveOpen) {{
                        pumpLed.material.color.setHex(0x22c55e); // Green
                        const intensity = 0.5 + 0.5 * Math.sin(elapsed * 12);
                        pumpLed.scale.setScalar(0.8 + 0.4 * intensity);

                        // Control pulse animation (Server -> Relay wire)
                        ctrlT += 0.8 * delta;
                        if (ctrlT > 1) ctrlT = 0;
                        ctrlPulse.visible = true;
                        ctrlPulse.position.copy(getPointOnLine(serverToRelayWirePts, ctrlT));
                    }} else {{
                        pumpLed.material.color.setHex(0xef4444); // Red
                        pumpLed.scale.setScalar(1.0);
                        ctrlPulse.visible = false;
                    }}

                    // Water flow
                    if (valveOpen) {{
                        // Pipe Flow indicators
                        flowT += 0.6 * delta;
                        if (flowT > 1) flowT = 0;
                        flowIndicator.visible = true;

                        // Flow path coordinates depend on which zone is irrigated
                        if (isGreenhouse) {{
                            const path = [ [2.8, 1.2, -2.8], [2.8, 0.15, -2.8], [2.8, 0.15, -0.4], [-2.5, 0.15, -0.4], [-2.5, 1.15, -0.4] ];
                            flowIndicator.position.copy(getPointOnLine(path, flowT));
                        }} else {{
                            const path = [ [2.8, 1.2, -2.8], [2.8, 0.15, -2.8], [2.8, 0.15, -0.4], [2.5, 0.15, -0.4], [2.5, 0.95, -0.4] ];
                            flowIndicator.position.copy(getPointOnLine(path, flowT));
                        }}

                        // Dripping water droplets
                        const emitterX = isGreenhouse ? -2.5 : 2.5;
                        const emitterY = isGreenhouse ? 0.15 + ghPipeHeight : 0.15 + ofPipeHeight;
                        
                        drops.forEach(d => {{
                            d.age += 1;
                            if (d.age > 0) {{
                                d.visible = true;
                                d.position.y += d.velocity * 5 * delta;
                                if (d.position.y <= 0.2) {{
                                    // Reset drop to emitter line with random offset along crop line
                                    d.position.set(emitterX, emitterY - 0.05, -1.2 + Math.random() * 3.0);
                                }}
                            }}
                        }});
                    }} else {{
                        flowIndicator.visible = false;
                        drops.forEach(d => d.visible = false);
                    }}

                    renderer.render(scene, camera);
                }}

                window.addEventListener('resize', () => {{
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                }});

                animate();
            </script>
        </body>
        </html>
        """
        
        st.components.v1.html(three_js_html, height=580, scrolling=False)

        st.markdown(f"**Field Telemetry Node Reference:** `{node_id}` - Bounded Drip Zone (Crop: `{node_crop}`, Mode: `{node_mode}`). Drag the 3D scene to inspect the sensor depth alignment, wiring nodes and active valve triggers.")
    else:
        st.warning("No active nodes selected. Please select a node from the dashboard or sidebar.")
        
    st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# TAB 4: MANAGE SENSORS (Configure thresholds & CRUD delete)
# ==============================================================================
with tab_manage:
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card-title'><span>🔧 CONFIGURE ACTIVE SENSOR TELEMETRY</span></div>", unsafe_allow_html=True)
    
    # Render custom HTML table with threshold config options
    rows_html = ""
    for idx, node in enumerate(state["nodes"]):
        crit_th = node.get("critical_threshold", 30.0)
        tgt_th = node.get("target_threshold", 60.0)
        moist = node["moisture"]
        
        # Determine status badge
        if moist <= crit_th:
            badge_html = f"<span class='badge badge-red'>{moist}% Critical</span>"
        elif moist <= crit_th + 10:
            badge_html = f"<span class='badge badge-amber'>{moist}% Low</span>"
        else:
            badge_html = f"<span class='badge badge-green'>{moist}% Healthy</span>"
            
        valve_html = f"<span class='badge badge-{'green' if node['valve_open'] else 'red'}'>{'OPEN' if node['valve_open'] else 'CLOSED'}</span>"
        
        row_td = f"""
        <tr>
            <td style="font-weight: 700; font-family: monospace;">{node['id']}</td>
            <td>{node['name']}</td>
            <td><span class="badge badge-blue">{node['crop']}</span></td>
            <td>{node['depth']} cm</td>
            <td>{node['mode']}</td>
            <td>{valve_html}</td>
            <td>{badge_html}</td>
            <td style="font-weight: 700; color: #ef4444 !important;">{crit_th}%</td>
            <td style="font-weight: 700; color: #10b981 !important;">{tgt_th}%</td>
        </tr>
        """
        rows_html += row_td
        
    table_template = f"""
    <table class="data-table">
        <thead>
            <tr>
                <th>Node ID</th>
                <th>Name / Tag</th>
                <th>Crop</th>
                <th>Depth</th>
                <th>Control Mode</th>
                <th>Valve Status</th>
                <th>Soil Moisture</th>
                <th style="color: #ef4444;">Min Threshold</th>
                <th style="color: #10b981;">Max Target</th>
            </tr>
        </thead>
        <tbody>
            {rows_html}
        </tbody>
    </table>
    """
    st.markdown(table_template, unsafe_allow_html=True)
    
    st.markdown("<hr style='border-top:1px solid rgba(22,101,52,0.3); margin: 1.5rem 0;' />", unsafe_allow_html=True)
    
    # Edit / Delete active selected node
    st.markdown("### Update Configurations")
    ec1, ec2, ec3 = st.columns(3)
    
    with ec1:
        edit_node_id = st.selectbox("Select Target Node to Edit/Delete", options=[n["id"] for n in state["nodes"]])
        edit_node = next((n for n in state["nodes"] if n["id"] == edit_node_id), None)
        
    if edit_node:
        with ec2:
            edit_name = st.text_input("Edit Custom Tag", value=edit_node["name"])
            edit_depth = st.number_input("Sensor Installation Depth (cm)", min_value=10, max_value=80, value=int(edit_node["depth"]), step=10)
            
            # Threshold edits
            n_crit = st.number_input("Critical Trigger Threshold (%)", min_value=5.0, max_value=80.0, value=float(edit_node["critical_threshold"]))
            n_tgt = st.number_input("Irrigation Max Target (%)", min_value=20.0, max_value=95.0, value=float(edit_node["target_threshold"]))
            
        with ec3:
            edit_crop = st.selectbox("Crop Mapping Type", options=["Maize", "Coffee", "Beans", "Matooke"], index=["Maize", "Coffee", "Beans", "Matooke"].index(edit_node["crop"]))
            edit_mode = st.selectbox("Solenoid Valve Mode", options=["Auto", "Manual"], index=0 if edit_node["mode"] == "Auto" else 1)
            
            # Action buttons
            bc1, bc2 = st.columns(2)
            with bc1:
                if st.button("💾 Save Configs", use_container_width=True):
                    edit_node["name"] = edit_name
                    edit_node["depth"] = int(edit_depth)
                    edit_node["crop"] = edit_crop
                    edit_node["mode"] = edit_mode
                    edit_node["critical_threshold"] = n_crit
                    edit_node["target_threshold"] = n_tgt
                    add_log("Info", f"Updated node telemetry settings directly.", edit_node_id)
                    save_state(state)
                    st.toast(f"Updated config for {edit_node_id}!", icon="💾")
                    time.sleep(1)
                    st.rerun()
            with bc2:
                # Delete Action
                if st.button("🗑️ Delete Node", use_container_width=True):
                    state["nodes"] = [n for n in state["nodes"] if n["id"] != edit_node_id]
                    # Update selected node
                    if state["selected_node_id"] == edit_node_id and state["nodes"]:
                        state["selected_node_id"] = state["nodes"][0]["id"]
                    add_log("Warning", f"LoRa node connection disrupted & removed from field coordinates.", edit_node_id)
                    save_state(state)
                    st.toast(f"Deleted node {edit_node_id}!", icon="🗑️")
                    time.sleep(1)
                    st.rerun()
                    
    st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# TAB 4: ACTIVITY LOGS & REPORTS (Log filters and CSV export)
# ==============================================================================
with tab_logs:
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    st.markdown("<div class='glass-card-title'><span>📋 SYSTEM ACTIVITY LOGGER</span></div>", unsafe_allow_html=True)
    
    # Filter controls
    fc1, fc2, fc3 = st.columns([3, 3, 4])
    with fc1:
        log_filter_type = st.selectbox("Filter by Severity/Type", options=["ALL", "Info", "Alert", "Action"])
    with fc2:
        log_search_node = st.text_input("Search Node Target", value="", placeholder="e.g. NODE-A1")
        
    # Convert logs list to pandas dataframe for easy filtering & download
    df_logs = pd.DataFrame(state["logs"])
    
    if not df_logs.empty:
        # Filter logs
        if log_filter_type != "ALL":
            df_logs = df_logs[df_logs["type"] == log_filter_type]
        if log_search_node:
            df_logs = df_logs[df_logs["node"].str.contains(log_search_node, case=False)]
            
        # Draw filtered logs table
        log_rows_html = ""
        for index, row in df_logs.iterrows():
            l_type = row["type"]
            if l_type == "Alert":
                t_color = "red"
            elif l_type == "Action":
                t_color = "green"
            else:
                t_color = "blue"
                
            badge_l = f"<span class='badge badge-{t_color}'>{l_type}</span>"
            row_l = f"""
            <tr>
                <td style="font-family: monospace; color: #8da69c !important;">{row['time']}</td>
                <td>{badge_l}</td>
                <td><b style="color: #ffffff !important;">{row['node']}</b></td>
                <td>{row['message']}</td>
            </tr>
            """
            log_rows_html += row_l
            
        log_table_html = f"""
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Timestamp</th>
                    <th style="width: 15%;">Event Class</th>
                    <th style="width: 20%;">Origin Node</th>
                    <th>Detail Message Log</th>
                </tr>
            </thead>
            <tbody>
                {log_rows_html}
            </tbody>
        </table>
        """
        st.markdown(log_table_html, unsafe_allow_html=True)
        
        # Download button
        st.markdown("<div style='margin-bottom:1rem;'></div>", unsafe_allow_html=True)
        csv_data = df_logs.to_csv(index=False)
        st.download_button(
            label="📥 Export Logging History to CSV",
            data=csv_data,
            file_name=f"mazaosmart_activity_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv",
            use_container_width=True
        )
    else:
        st.info("No system activity logs found.")
        
    st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# TICK AND REU RUN SCHEDULER
# ==============================================================================
if state["is_playing"]:
    # Determine wait time based on speed setting
    # 1x = 3.5s delay | 3x = 1.2s delay | 10x = 0.35s delay
    delay_speed = 3.5
    if state["speed"] == 3:
        delay_speed = 1.2
    elif state["speed"] == 10:
        delay_speed = 0.35
        
    time.sleep(delay_speed)
    run_simulation_tick()
    st.rerun()
