# AgriSense AI: IoT Wokwi Simulation Integration Guide

This guide describes how to run and test the Wokwi-simulated ESP32 Smart Irrigation System integrated with your AgriSense AI Streamlit Dashboard.

---

## 🏗️ 1. Set Up the Wokwi ESP32 Simulation

1. Go to [Wokwi.com](https://wokwi.com).
2. Create a new **ESP32** project.
3. Replace the contents of the files in Wokwi with the provided configs:
   - Copy the C++ code from `wokwi/wokwi.ino` into Wokwi's `sketch.ino`.
   - Copy the JSON from `wokwi/diagram.json` into Wokwi's `diagram.json` tab (click on the editor area and select the "diagram.json" tab or toggle it).
4. Run the Wokwi simulation. The ESP32 will boot, connect to the virtual `Wokwi-GUEST` WiFi network, and connect to the public HiveMQ Broker (`broker.hivemq.com`).

---

## 💻 2. Set Up the Streamlit dashboard

1. Open your terminal in the physical project directory (`Soil Moisture Monitoring System`).
2. Make sure you have the virtual environment activated:
   ```powershell
   .venv\Scripts\activate
   ```
3. Verify that `paho-mqtt` is installed:
   ```powershell
   pip install paho-mqtt
   ```
4. Start the Streamlit application:
   ```powershell
   python main.py
   ```
5. Open the Streamlit dashboard URL (typically `http://localhost:8501`) in your web browser.

---

## 🧪 3. Verification & Testing

### Real-Time Telemetry Check
1. In the **AgriSense AI** dashboard web page, navigate to **📊 Dashboard Monitoring**.
2. Select **NODE-WOKWI** under the **Active Monitoring Target** dropdown.
3. Observe the circular gauge. It will display the live soil moisture percent published by the Wokwi Potentiometer slider.
4. You should see the **Live IoT Climate Telemetry** label displaying the temperature (DHT22 sensor dial) and humidity values updated in real time.

### Automated Valve Logic (Auto Mode)
1. Ensure the irrigation control mode for **NODE-WOKWI** is set to **Auto**.
2. In your Wokwi running simulator, scroll up or select the **Potentiometer** slider and turn it down below **35%** (e.g. 20%).
3. Within 1-2 seconds, you will observe:
   - The dashboard updates is soil moisture gauge.
   - The dashboard opens the solenoid valve.
   - The dashboard publishes an MQTT command to open the pump.
   - The ESP32 simulator receives the message:
     - The **relay module** clicks closed.
     - The **green LED** (water pump) turns ON.
     - The **I2C LCD display** shows `PUMP: ON`.
4. Now, slide the Wokwi Potentiometer up above **70%** (e.g. 75%).
5. The dashboard will automatically turn the solenoid valve to **CLOSED**, publish a shutdown command to MQTT, and the green LED on Wokwi will turn OFF (LCD displays `PUMP: OFF`).

### Manual Overrides (Manual Mode)
1. Switch the IoT node control mode to **Manual** in the Streamlit UI.
2. Click **Open Valve Manually**. The Wokwi LED will instantly turn ON and the LCD will show `PUMP: ON`.
3. Click **Close Valve Manually**. The Wokwi LED will instantly turn OFF and the LCD will show `PUMP: OFF`.
