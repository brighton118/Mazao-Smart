# Agronomical Rules and Irrigation logic - AgriSense Smart Farming

This document defines the crop-specific agricultural metrics, soil moisture thresholds, and automatic irrigation controller rules used in the AgriSense telemetry loop.

## 1. Crop Moisture Profiles
Each crop in the AgriSense plots has designated upper and lower volumetric water content (VWC) bounds:

| Crop Type | Critical Min Threshold (%) | Target Max Threshold (%) | Probe Depth (cm) | Moisture Sensitivity |
|---|---|---|---|---|
| **Coffee** | 35% | 70% | 40 cm | High (drought triggers root decay) |
| **Maize** | 30% | 65% | 30 cm (Wokwi: 15cm) | Medium (critical during pollination phase) |
| **Beans** | 35% | 70% | 20 cm | Low (shallow roots need frequent short pulses) |
| **Sorghum** | 30% | 65% | 45 cm | Very Low (drought-hardy crop type) |

## 2. Telemetry Interpretation Rules
The system categorizes soil health status using the current VWC percentage relative to the crop's configured threshold:
- **Optimal (green)**: Moisture is greater than or equal to the Critical Min Threshold. The crop is well-hydrated. No irrigation actions are needed.
- **Low Moisture (amber)**: Moisture falls below the Critical Min Threshold, but is within 10% VWC of the threshold. If automatic mode is active, the system starts irrigation.
- **Critical Dry (red)**: Moisture is more than 10% VWC below the Critical Min Threshold (e.g. Coffee VWC < 25%). Triggers persistent sound warnings and alerts the operator.

## 3. Auto-Irrigation Solenoid Valve Control Loop
When the system is in **Auto** irrigation mode, the solenoid valves operate under closed-loop control:
1. **Trigger Condition**: If a sensor node's current moisture is less than or equal to its `critical_threshold` (also referred to as `minMoisture` in code), the corresponding Solenoid Valve is opened automatically:
   - Sets node's `valve_open` (or `irrigating` in React) state to `True`.
   - Logging event triggers: `"Solenoid valve OPENED automatically (low moisture: X% <= Y%)"`.
2. **Cutoff Condition**: The valve remains open until the soil moisture reaches the `target_threshold` (also referred to as `maxMoisture` in code):
   - Sets node's `valve_open` / `irrigating` state to `False`.
   - Logging event triggers: `"Solenoid valve CLOSED automatically (moisture restored: X% >= Y%)"`.

## 4. Temperature and Weather Adaptive Logic
- **Weather Adjustments**:
  - In a **rainy** scenario, the system automatically suspends auto-irrigation to conserve water and prevent soil drowning (waterlogging), even if moisture drops below the threshold.
  - In **drought** scenarios, soil drying is accelerated (nominally -0.6% VWC per simulation tick), requiring frequent irrigation cycles and careful monitoring of reservoir levels.
- **Thermal Stress Bounds**:
  - Crop transpiration increases dramatically at temperatures above 30°C.
  - Temperatures below 15°C indicate possible thermal shock for tropical crops like Matooke/Coffee.
