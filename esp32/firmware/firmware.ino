// ============================================
// ESP32 IoT Smart Drip Irrigation — Firmware
// ============================================
// Reads DHT11 (temp + humidity), soil moisture,
// and rain sensor. Sends data to backend every
// 30s via HTTP POST. Receives pump command from
// backend. Controls relay. Serial Monitor shows
// ALL readings in real-time.
//
// Hardware Connections:
//   DHT11 Signal    → GPIO 4
//   Soil Moisture   → GPIO 36 (A0 / VP)
//   Rain Sensor D0  → GPIO 12
//   Relay IN        → GPIO 14
//
// All config is in config.h
// ============================================

#include <WiFi.h>
#include <HTTPClient.h>
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
int sendCount = 0;

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(1000);

  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║   🌱 XENO GARDEN — ESP32 Firmware   ║");
  Serial.println("║   Smart Drip Irrigation System       ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println();

  // Print pin configuration
  Serial.println("📌 Pin Configuration:");
  Serial.println("   DHT11 Signal  → GPIO " + String(DHT_PIN));
  Serial.println("   Soil Moisture → GPIO " + String(SOIL_MOISTURE_PIN));
  Serial.println("   Rain Sensor   → GPIO " + String(RAIN_SENSOR_PIN));
  Serial.println("   Relay/Pump    → GPIO " + String(PUMP_PIN));
  Serial.println();

  // Pin modes
  pinMode(PUMP_PIN, OUTPUT);
  pinMode(RAIN_SENSOR_PIN, INPUT);
  // Analog pins don't need pinMode on ESP32

  // Start with pump OFF
  digitalWrite(PUMP_PIN, PUMP_OFF);
  Serial.println("🔌 Pump initialized: OFF");

  // Initialize DHT sensor
  dht.begin();
  Serial.println("🌡️  DHT11 initialized on GPIO " + String(DHT_PIN));

  // Connect to WiFi
  connectWiFi();

  Serial.println();
  Serial.println("✅ Setup complete!");
  Serial.println("📡 Sending data every " + String(SEND_INTERVAL / 1000) + " seconds");
  Serial.println("🎯 Server: " + String(SERVER_URL));
  Serial.println("🆔 Device: " + String(DEVICE_ID));
  Serial.println();
  Serial.println("════════════════════════════════════════");
  Serial.println();
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if disconnected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost! Reconnecting...");
    connectWiFi();
  }

  // Send data every SEND_INTERVAL ms
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    sendCount++;

    // 1. Read all sensors
    float soilMoisture = readSoilMoisture();
    float temperature  = readTemperature();
    float humidity     = readHumidity();
    bool  rainDetected = readRainSensor();

    // 2. Validate DHT readings
    if (temperature < -900 || humidity < -900) {
      Serial.println("⚠️  Skipping this cycle — DHT read failed\n");
      return;
    }

    // 3. Print everything to Serial Monitor
    Serial.println("┌──────────────────────────────────────┐");
    Serial.println("│  📊 SENSOR READINGS  #" + String(sendCount));
    Serial.println("├──────────────────────────────────────┤");
    Serial.println("│  💧 Soil Moisture : " + String(soilMoisture, 1) + " %");
    Serial.println("│  🌡️  Temperature   : " + String(temperature, 1) + " °C");
    Serial.println("│  💨 Humidity      : " + String(humidity, 1) + " %");
    Serial.println("│  🌧️  Rain          : " + String(rainDetected ? "YES ☔" : "NO  ☀️"));
    Serial.println("│  🔌 Pump          : " + String(pumpState ? "ON 💧" : "OFF"));
    Serial.println("├──────────────────────────────────────┤");

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
      localFallbackLogic(soilMoisture, temperature, rainDetected);
    }

    Serial.println("│  🎯 Pump Command  : " + pumpCommand);
    Serial.println("│  🔌 Pump State    : " + String(pumpState ? "ON 💧" : "OFF"));
    Serial.println("│  📡 Backend       : " + String(backendReachable ? "Connected ✅" : "Offline ❌"));
    Serial.println("│  📶 WiFi RSSI     : " + String(WiFi.RSSI()) + " dBm");
    Serial.println("└──────────────────────────────────────┘");
    Serial.println();
  }
}

// ============================================
// SENSOR READING FUNCTIONS
// ============================================

float readSoilMoisture() {
  // ESP32 ADC: 12-bit (0-4095)
  // Take average of 10 readings for stability
  long total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(SOIL_MOISTURE_PIN);
    delay(5);
  }
  int raw = total / 10;

  // Map ADC to 0-100% (inverted: dry = high ADC, wet = low ADC)
  float moisture = map(raw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  moisture = constrain(moisture, 0.0, 100.0);

  Serial.println("│  [RAW] Soil ADC   : " + String(raw) + " → " + String(moisture, 1) + "%");

  return moisture;
}

float readTemperature() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    Serial.println("│  ⚠️  DHT temp read FAILED!");
    return -999.0;
  }
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    Serial.println("│  ⚠️  DHT humidity read FAILED!");
    return -999.0;
  }
  return hum;
}

bool readRainSensor() {
  // Rain sensor module D0 output:
  //   LOW  = rain detected (wet)
  //   HIGH = no rain (dry)
  return digitalRead(RAIN_SENSOR_PIN) == LOW;
}

// ============================================
// NETWORK FUNCTIONS
// ============================================

void connectWiFi() {
  Serial.println("📡 Connecting to WiFi: " + String(WIFI_SSID));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > WIFI_TIMEOUT) {
      Serial.println("\n❌ WiFi connection TIMEOUT!");
      Serial.println("   Check SSID/Password in config.h");
      return;
    }
  }

  Serial.println();
  Serial.println("✅ WiFi connected!");
  Serial.println("   📍 IP:   " + WiFi.localIP().toString());
  Serial.println("   📶 RSSI: " + String(WiFi.RSSI()) + " dBm");
}

String sendToBackend(float moisture, float temp, float hum, bool rain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│  ❌ WiFi not connected → FALLBACK");
    backendReachable = false;
    return "FALLBACK";
  }

  HTTPClient http;
  http.begin(SERVER_URL);
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

  Serial.println("│  📤 Sending: " + jsonPayload);

  // Send POST request
  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("│  📥 Response (" + String(httpCode) + "): " + response);

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
    Serial.println("│  ❌ HTTP Error: " + String(httpCode) + " (attempt " + String(failedAttempts) + ")");
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
    Serial.println("│  " + String(on ? "💧 PUMP → ON" : "🛑 PUMP → OFF"));
  }
  pumpState = on;
  digitalWrite(PUMP_PIN, on ? PUMP_ON : PUMP_OFF);
}

// ============================================
// LOCAL FALLBACK (when backend is unreachable)
// ============================================

void localFallbackLogic(float moisture, float temp, bool rain) {
  Serial.println("│  🔄 Running LOCAL fallback logic...");

  // Rule 1: Pump ON if dry + hot + no rain
  if (moisture < FALLBACK_MOISTURE_LOW && temp > FALLBACK_TEMP_HIGH && !rain) {
    activatePump(true);
    Serial.println("│  🤖 LOCAL → Pump ON (dry + hot + no rain)");
  }
  // Rule 2: Pump OFF if wet enough
  else if (moisture >= FALLBACK_MOISTURE_HIGH) {
    activatePump(false);
    Serial.println("│  🤖 LOCAL → Pump OFF (moisture sufficient)");
  }
  // Otherwise: keep current state
  else {
    Serial.println("│  🤖 LOCAL → No change (keeping pump " + String(pumpState ? "ON" : "OFF") + ")");
  }
}
