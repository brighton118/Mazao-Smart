# Hardware Specifications - AgriSense Smart Farming

This document captures the hardware layout, module configurations, capabilities, and parameters for the AgriSense system components.

## 1. LoRa Soil Moisture Node Probes
Each plot contains an RF-shielded LoRa probe assembly featuring:
- **Processor**: Ultra-low-power MCU (3.3V) with deep-sleep modes.
- **RF Transmitter**: Semtech SX1276 LoRa transceiver operating in the 868/915 MHz ISM band.
- **Node Designations & Depths**:
  - **NODE-A1 & NODE-A2 (Coffee)**: Design depth of **40 cm** (root-zone focus for coffee crop).
  - **NODE-B1 & NODE-B4 (Beans)**: Design depth of **20 cm** (shallow roots).
  - **NODE-C1 & NODE-C2 (Sorghum)**: Design depth of **45 cm**.
  - **NODE-WOKWI (Maize)**: Active Wokwi Node design depth of **15 cm** (used for lab prototyping).
- **Probes**: FDR capacitive moisture probes. Sensor calibration yields moisture range from 0% (completely dry air) to 100% (saturated water).
- **Power**: 18650 Li-ion battery (3.7V / 2600mAh) charged via a mini 1W monocrystalline solar cell. Nominal battery discharge cuts off at 3.3V.

## 2. Solar Charging & Battery System
The gateway house and central telemetry node are powered by:
- **Solar Array**: 2x 220W monocrystalline solar panels connected in parallel (total nominal capacity: **440W**).
- **MPPT Controller**: 12V/24V Auto-select MPPT tracker charging a 100Ah LiFePO4 battery bank.
- **Parameters**:
  - Solar Peak Output: ~450W (in sunny afternoons).
  - Average Base Draw: ~5W for central system logic.
  - Active Draw: ~100W when the central high-pressure water pump runs.
  - Battery capacity threshold: Pump automatically shuts down if the central battery falls below 20% to prevent deep discharge damage.

## 3. Water Pump & Reservoir Infrastructure
- **Reservoir**: 5,000 Litre elevated gravity tank.
- **Water Pump**: Centrifugal 220V AC pump drawing 95W. Maximum flow rate is **25 Litres/min**.
- **Pumping Level Rules**:
  - Pump is activated automatically to fill the reservoir tank if tank level falls below 1,000 Litres (20%).
  - Pump stops once reservoir reaches 5,000 Litres (100%).
  - If reservoir is empty, auxiliary main valves are shut to avoid pump running dry.

## 4. Solenoid Actuator Valves
- **Actuators**: 12V DC brass electric solenoid pulse valves.
- **Physical Position**:
  - Closed: 0 degrees angle.
  - Open: 90 degrees angle.
- **Automation Logic**: Responsive solenoid valves open automatically under threshold conditions, letting gravity-fed water from the reservoir irrigate the target plot.
- **Water Usage Metric**: Evaluated at a nominal rate of 25 Litres per tick per irrigating valve.
