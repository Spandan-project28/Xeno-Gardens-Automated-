// ============================================
// ESP8266 IoT Smart Drip Irrigation — Firmware
// ============================================
// Reads DHT11 (temp + humidity), soil moisture,
// and rain sensor. Sends data to backend every
// 30s. Receives pump ON/OFF command. Controls
// relay. Falls back to local logic if backend
// is unreachable.
//
// Hardware Connections (ESP8266 NodeMCU):
//   DHT11 Signal    → D4  (GPIO2)
//   Soil Moisture   → A0  (Analog)
//   Rain Sensor D0  → D6  (GPIO12)
//   Relay IN        → D5  (GPIO14)
//
// All config is in config.h — edit that file
// for WiFi, pins, server URL, calibration, etc.
// ============================================

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"

// ---- Initialize Sensors ----
DHT dht(DHT_PIN, DHT_TYPE);

// ---- State ----
bool pumpState = false;
bool backendReachable = true;
unsigned long lastSendTime = 0;
int failedAttempts = 0;

// ---- WiFi Client (required for ESP8266 HTTPClient) ----
WiFiClient wifiClient;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(1000);

  debugPrint("\n🌱 ============================");
  debugPrint("   Xeno Garden - ESP8266");
  debugPrint("   ============================\n");

  // Pin modes
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  // A0 doesn't need pinMode on ESP8266

  // Start with pump OFF
  digitalWrite(PUMP_PIN, PUMP_OFF);

  // Initialize DHT sensor
  dht.begin();

  // Connect to WiFi
  connectWiFi();

  debugPrint("✅ Setup complete. Starting sensor loop...\n");
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    debugPrint("⚠️  WiFi lost. Reconnecting...");
    connectWiFi();
  }

  // Send data every SEND_INTERVAL ms
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;

    // 1. Read all sensors
    float soilMoisture = readSoilMoisture();
    float temperature  = readTemperature();
    float humidity     = readHumidity();
    bool  rainDetected = readRainSensor();

    // 2. Validate readings (skip bad DHT reads)
    if (temperature < -900 || humidity < -900) {
      debugPrint("⚠️  Skipping cycle — DHT read failed");
      return;
    }

    // 3. Print readings to Serial Monitor
    debugPrint("📊 --- Sensor Readings ---");
    debugPrint("   Moisture:  " + String(soilMoisture, 1) + "%");
    debugPrint("   Temp:      " + String(temperature, 1) + "°C");
    debugPrint("   Humidity:  " + String(humidity, 1) + "%");
    debugPrint("   Rain:      " + String(rainDetected ? "YES ☔" : "NO ☀️"));
    debugPrint("   Pump:      " + String(pumpState ? "ON 💧" : "OFF"));

    // 4. Send to backend and get pump command
    String pumpCommand = sendToBackend(
      soilMoisture, temperature, humidity, rainDetected
    );

    // 5. Control pump based on response
    if (pumpCommand == "ON") {
      activatePump(true);
    } else if (pumpCommand == "OFF") {
      activatePump(false);
    } else if (pumpCommand == "FALLBACK") {
      // Backend unreachable — use local safety logic
      localFallbackLogic(soilMoisture, temperature, rainDetected);
    }

    debugPrint("🔌 Pump: " + String(pumpState ? "ON 💧" : "OFF"));
    debugPrint("-------------------------\n");
  }
}

// ============================================
// SENSOR READING FUNCTIONS
// ============================================

float readSoilMoisture() {
  // ESP8266 A0: 10-bit ADC (0-1023)
  // Take average of 5 readings for stability
  long total = 0;
  for (int i = 0; i < 5; i++) {
    total += analogRead(SOIL_MOISTURE_PIN);
    delay(10);
  }
  int raw = total / 5;

  // Map ADC value to 0-100% (inverted: dry = high ADC, wet = low ADC)
  float moisture = map(raw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  moisture = constrain(moisture, 0.0, 100.0);

  debugPrint("   [DEBUG] Soil raw ADC: " + String(raw) + " → " + String(moisture, 1) + "%");

  return moisture;
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    debugPrint("⚠️  DHT temperature read failed!");
    return -999.0; // Sentinel value
  }
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    debugPrint("⚠️  DHT humidity read failed!");
    return -999.0;
  }
  return hum;
}

bool readRainSensor() {
  // Most rain sensor modules:
  // D0 output = LOW  when rain is detected (wet)
  // D0 output = HIGH when dry (no rain)
  return digitalRead(RAIN_SENSOR_PIN) == LOW;
}

// ============================================
// NETWORK FUNCTIONS
// ============================================

void connectWiFi() {
  debugPrint("📡 Connecting to WiFi: " + String(WIFI_SSID));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > WIFI_TIMEOUT) {
      debugPrint("\n❌ WiFi connection timeout!");
      return;
    }
  }

  debugPrint("\n✅ WiFi connected!");
  debugPrint("   IP:   " + WiFi.localIP().toString());
  debugPrint("   RSSI: " + String(WiFi.RSSI()) + " dBm");
}

String sendToBackend(float moisture, float temp, float hum, bool rain) {
  if (WiFi.status() != WL_CONNECTED) {
    debugPrint("❌ WiFi not connected. Using fallback.");
    backendReachable = false;
    return "FALLBACK";
  }

  HTTPClient http;
  http.begin(wifiClient, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(HTTP_TIMEOUT);

  // Build JSON payload
  JsonDocument doc;
  doc["deviceId"]       = DEVICE_ID;
  doc["soil_moisture"]  = round(moisture * 10) / 10.0;
  doc["temperature"]    = round(temp * 10) / 10.0;
  doc["humidity"]       = round(hum * 10) / 10.0;
  doc["rain_status"]    = rain;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  debugPrint("📤 Sending: " + jsonPayload);

  // Send POST request
  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    String response = http.getString();
    debugPrint("📥 Response (" + String(httpCode) + "): " + response);

    backendReachable = true;
    failedAttempts = 0;

    // Parse pump command from response
    JsonDocument resDoc;
    DeserializationError error = deserializeJson(resDoc, response);

    if (!error && resDoc.containsKey("pump")) {
      String pump = resDoc["pump"].as<String>();
      http.end();
      return pump;
    }
  } else {
    failedAttempts++;
    debugPrint("❌ HTTP Error: " + String(httpCode) + " (attempt " + String(failedAttempts) + ")");
    backendReachable = false;
  }

  http.end();
  return "FALLBACK";
}

// ============================================
// PUMP CONTROL
// ============================================

void activatePump(bool on) {
  if (pumpState != on) {
    debugPrint(on ? "💧 PUMP → ON" : "🛑 PUMP → OFF");
  }
  pumpState = on;
  digitalWrite(PUMP_PIN, on ? PUMP_ON : PUMP_OFF);
}

// ============================================
// LOCAL FALLBACK (when backend is unreachable)
// ============================================

void localFallbackLogic(float moisture, float temp, bool rain) {
  debugPrint("🔄 Running local fallback logic...");

  // Rule 1: Pump ON if moisture is low AND temp is high AND no rain
  if (moisture < FALLBACK_MOISTURE_LOW && temp > FALLBACK_TEMP_HIGH && !rain) {
    activatePump(true);
    debugPrint("🤖 LOCAL: Pump ON (moisture low, temp high, no rain)");
  }
  // Rule 2: Pump OFF if moisture is sufficient
  else if (moisture >= FALLBACK_MOISTURE_HIGH) {
    activatePump(false);
    debugPrint("🤖 LOCAL: Pump OFF (moisture sufficient)");
  }
  // Otherwise: keep current pump state
}

// ============================================
// DEBUG HELPER
// ============================================

void debugPrint(String msg) {
  if (DEBUG_MODE) {
    Serial.println(msg);
  }
}
