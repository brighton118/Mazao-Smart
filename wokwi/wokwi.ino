#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// --- Configuration ---
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// Topic Designations
const char* topic_telemetry = "agrisense/node_wokwi/telemetry";
const char* topic_pump_cmd  = "agrisense/node_wokwi/pump";

// Pin Setup
#define PIN_MOISTURE 34  // Analog pin for potentiometer
#define PIN_DHT      15  // Digital pin for DHT22
#define PIN_PUMP     12  // Digital pin for Relay/LED

// DHT22 Instantiation
#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// LCD Instantiation (I2C Address 0x27, 16 Cols, 2 Rows)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// MQTT & WiFi Clients
WiFiClient espClient;
PubSubClient client(espClient);

// Timing variables
unsigned long lastMsgTime = 0;
const unsigned long telemetryInterval = 2500; // Publish every 2.5 seconds

// State Variables
int pumpState = 0; // 0 = OFF, 1 = ON

// --- Functions ---

void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  WiFi.begin(ssid, password);

  int counter = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(counter % 16, 1);
    lcd.print(".");
    counter++;
  }

  Serial.println("");
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP().toString());
  delay(1500);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String msg = "";
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.println(msg);

  // Command handling
  if (String(topic) == topic_pump_cmd) {
    if (msg == "1" || msg == "ON") {
      pumpState = 1;
      digitalWrite(PIN_PUMP, HIGH);
      Serial.println("Pump Command: TURN ON");
    } else if (msg == "0" || msg == "OFF") {
      pumpState = 0;
      digitalWrite(PIN_PUMP, LOW);
      Serial.println("Pump Command: TURN OFF");
    }
    updateLCDDisplay();
    // Publish status immediately to keep UI in lockstep
    publishTelemetry();
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Connecting MQTT");
    
    // Create a random client ID
    String client_id = "AgriSenseAIClient-" + String(random(0xffff), HEX);
    
    if (client.connect(client_id.c_str())) {
      Serial.println("Connected!");
      lcd.setCursor(0, 1);
      lcd.print("Broker Online!");
      
      // Subscribe to command topic
      client.subscribe(topic_pump_cmd);
      Serial.print("Subscribed to command topic: ");
      Serial.println(topic_pump_cmd);
      delay(1000);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" - Retrying in 5 seconds...");
      lcd.setCursor(0, 1);
      lcd.print("Retry in 5 sec...");
      delay(5000);
    }
  }
}

void updateLCDDisplay() {
  // Read local values for instant display response
  int adcVal = analogRead(PIN_MOISTURE);
  // Map ADC (0 - 4095) to Soil Moisture (0% - 100%)
  // High ADC = dry, Low ADC = wet, map: 4095->0%, 0->100%
  float moisturePct = map(adcVal, 0, 4095, 100, 0);
  moisturePct = constrain(moisturePct, 0, 100);

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Handle DHT read errors
  if (isnan(temp)) temp = 0.0;
  if (isnan(hum)) hum = 0.0;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("MST:" + String((int)moisturePct) + "%  PMP:" + (pumpState == 1 ? "ON" : "OFF"));
  
  lcd.setCursor(0, 1);
  lcd.print("T:" + String(temp, 1) + "C H:" + String((int)hum) + "%");
}

void publishTelemetry() {
  int adcVal = analogRead(PIN_MOISTURE);
  // Invert calibration: Wokwi Potentiometer pin goes 0-4095. 
  // We map: 0 = 100% (saturated), 4095 = 0% (completely dry).
  float moisturePct = (float)map(adcVal, 0, 4095, 1000, 0) / 10.0;
  moisturePct = constrain(moisturePct, 0.0, 100.0);

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp)) temp = 24.5; // fallback
  if (isnan(hum)) hum = 58.0;   // fallback

  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["moisture"] = round(moisturePct * 10.0) / 10.0;
  doc["temperature"] = round(temp * 10.0) / 10.0;
  doc["humidity"] = round(hum * 10.0) / 10.0;
  doc["pump_status"] = pumpState;
  
  char jsonBuffer[256];
  serializeJson(doc, jsonBuffer);

  Serial.print("Publishing telemetry: ");
  Serial.println(jsonBuffer);
  
  client.publish(topic_telemetry, jsonBuffer);
}

void setup() {
  Serial.begin(115200);
  
  // Pin modes
  pinMode(PIN_PUMP, OUTPUT);
  digitalWrite(PIN_PUMP, LOW); // Start with pump OFF

  // Sensors Startup
  dht.begin();
  
  // Wire initialization for I2C and LCD Setup
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("AgriSense AI");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(1500);

  // Network and MQTT Startup
  setupWiFi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsgTime > telemetryInterval) {
    lastMsgTime = now;
    publishTelemetry();
    updateLCDDisplay();
  }
}
