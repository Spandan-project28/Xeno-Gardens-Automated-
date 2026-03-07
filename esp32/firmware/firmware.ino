// ============================================
// ESP32 IoT Smart Drip Irrigation — Firmware
// ============================================
// Reads DHT11 (temp + humidity), soil moisture,
// and rain sensor. Sends data to backend every
// 10s via HTTP POST. Serial Monitor shows
// ALL readings in real-time.
//
// Hardware Connections (SENSORS ONLY, NO RELAY):
//   DHT11 Signal    → GPIO 4
//   Soil Moisture   → GPIO 34
//   Rain Sensor D0  → GPIO 27
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
  Serial.println("║   Sensors Only (No Relay) v2         ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println();

  // Print pin configuration
  Serial.println("📌 Pin Configuration:");
  Serial.println("   DHT11 Signal  → GPIO " + String(DHT_PIN));
  Serial.println("   Soil Moisture → GPIO " + String(SOIL_MOISTURE_PIN));
  Serial.println("   Rain Sensor   → GPIO " + String(RAIN_SENSOR_PIN));
  Serial.println();

  // Pin modes
  pinMode(RAIN_SENSOR_PIN, INPUT_PULLUP);

  // Set ADC attenuation for full 0-3.3V range on ALL ADC pins
  analogSetAttenuation(ADC_11db);

  // Initialize DHT sensor
  dht.begin();
  Serial.println("🌡️  DHT11 initialized");

  // ---- PIN SCANNER: Find your sensors! ----
  delay(2000);
  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║   🔍 PIN SCANNER — Finding Sensors   ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println();

  // Scan ALL ADC-capable pins to find the soil moisture sensor
  Serial.println("📡 ANALOG SCAN (looking for soil moisture):");
  Serial.println("   If your sensor is connected, ONE pin should show a value > 0");
  Serial.println();

  int adcPins[] = {32, 33, 34, 35, 36, 39};
  String adcNames[] = {"GPIO32", "GPIO33", "GPIO34 (A6)", "GPIO35 (A7)", "GPIO36 (A0/SVP)", "GPIO39 (A3/SVN)"};
  for (int i = 0; i < 6; i++) {
    int val = analogRead(adcPins[i]);
    String status = "";
    if (val > 100) status = " ✅ SENSOR DETECTED!";
    else if (val == 0) status = " ❌ nothing";
    else status = " ⚠️ weak signal";
    Serial.println("   " + adcNames[i] + " = " + String(val) + status);
  }

  // Scan digital pins for rain sensor
  Serial.println();
  Serial.println("📡 DIGITAL SCAN (looking for rain sensor):");
  Serial.println("   Rain sensor D0 should read 1 (HIGH) when DRY");
  Serial.println();

  int digiPins[] = {2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27};
  for (int i = 0; i < 17; i++) {
    if (digiPins[i] == DHT_PIN) continue;  // Skip DHT pin
    pinMode(digiPins[i], INPUT_PULLUP);
    delay(10);
    int val = digitalRead(digiPins[i]);
    Serial.println("   GPIO" + String(digiPins[i]) + " = " + String(val) + (val == HIGH ? " (HIGH/dry)" : " (LOW/rain)"));
  }

  Serial.println();
  Serial.println("════════════════════════════════════════");
  Serial.println("👆 Look at the scan results above!");
  Serial.println("   Find which pin shows your soil moisture reading (value > 0)");
  Serial.println("   Find which pin shows your rain sensor correctly");
  Serial.println("════════════════════════════════════════");
  Serial.println();

  // Re-set rain pin after scan
  pinMode(RAIN_SENSOR_PIN, INPUT_PULLUP);

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
    Serial.println("├──────────────────────────────────────┤");

    // 4. Send to backend
    sendToBackend(soilMoisture, temperature, humidity, rainDetected);

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
    for(int i = 0; i < 3; i++) {
      delay(500);
      temp = dht.readTemperature();
      if (!isnan(temp)) break;
    }
  }
  if (isnan(temp)) {
    Serial.println("│  ⚠️  DHT temp read FAILED!");
    return -999.0;
  }
  return temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  if (isnan(hum)) {
    for(int i = 0; i < 3; i++) {
      delay(500);
      hum = dht.readHumidity();
      if (!isnan(hum)) break;
    }
  }
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

void sendToBackend(float moisture, float temp, float hum, bool rain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│  ❌ WiFi not connected — skipping send");
    backendReachable = false;
    return;
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
  } else {
    failedAttempts++;
    Serial.println("│  ❌ HTTP Error: " + String(httpCode) + " (attempt " + String(failedAttempts) + ")");
    backendReachable = false;
  }

  http.end();
}
