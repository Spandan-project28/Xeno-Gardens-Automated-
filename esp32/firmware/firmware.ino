// ============================================
// ESP32 IoT Smart Drip Irrigation — Firmware
// ============================================
// Reads DHT11 (temp + humidity), soil moisture,
// and rain sensor. Sends data to backend every 2s.
// Relay is controlled every 300ms via fast poll.
//
// Hardware Connections:
//   DHT11 Signal    → GPIO 4
//   Soil Moisture   → GPIO 34
//   Rain Sensor D0  → GPIO 27
//   Relay IN        → GPIO 26
//
// All config is in config.h
// ============================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <WiFiManager.h>
#include "config.h"

// ---- Initialize Sensors ----
DHT dht(DHT_PIN, DHT_TYPE);

// ---- State ----
bool backendReachable = false;
unsigned long lastSendTime = 0;
unsigned long lastPumpCheck = 0;
int failedAttempts = 0;
int sendCount = 0;
String pumpStatus = "OFF";   // mirrors what the relay is doing

// ============================================
// RELAY CONTROL — single source of truth
// ============================================
void setRelay(String command) {
  if (command == "ON") {
    digitalWrite(RELAY_PIN, LOW);   // LOW triggers relay (Active-Low module)
    pumpStatus = "ON";
    Serial.println("🔌 RELAY ON");
  } else {
    digitalWrite(RELAY_PIN, HIGH);  // HIGH = relay off
    pumpStatus = "OFF";
    Serial.println("🔌 RELAY OFF");
  }
}

// ============================================
// FUNCTION DECLARATIONS (forward)
// ============================================
void checkPumpCommand();
void sendToBackend(float moisture, float temp, float hum, bool rain);
void connectWiFi();
float readSoilMoisture();
float readTemperature();
float readHumidity();
bool readRainSensor();

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  Serial.println();
  Serial.println("╔══════════════════════════════════════╗");
  Serial.println("║   🌱 XENO GARDEN — ESP32 Firmware   ║");
  Serial.println("╚══════════════════════════════════════╝");
  Serial.println();

  // Relay pin — MUST set HIGH first to keep pump OFF at boot
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("✅ Relay pin initialised → OFF");

  // Other pins
  pinMode(RAIN_SENSOR_PIN, INPUT_PULLUP);
  analogSetAttenuation(ADC_11db);

  // DHT
  dht.begin();
  Serial.println("✅ DHT11 initialised");

  // WiFi — try hardcoded first, then WiFiManager portal
  Serial.println("🌐 Connecting to WiFi: " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long t = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n❌ Hardcoded WiFi failed — launching portal...");
    WiFiManager wm;
    if (!wm.autoConnect(AP_NAME, AP_PASSWORD)) {
      Serial.println("❌ Portal failed — restarting");
      ESP.restart();
    }
  } else {
    Serial.println("\n✅ WiFi connected! IP: " + WiFi.localIP().toString());
  }

  Serial.println();
  Serial.println("🎯 Server : " + String(SERVER_URL));
  Serial.println("🆔 Device : " + String(DEVICE_ID));
  Serial.println("⏱  Pump poll every " + String(PUMP_CHECK_INTERVAL) + " ms");
  Serial.println("⏱  Sensor POST every " + String(SEND_INTERVAL) + " ms");
  Serial.println();
}

// ============================================
// MAIN LOOP
// ============================================
void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if lost
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi lost — reconnecting...");
    WiFi.reconnect();
    delay(3000);
    return;
  }

  // ── FAST: check pump command every 300 ms ──
  if (now - lastPumpCheck >= PUMP_CHECK_INTERVAL) {
    lastPumpCheck = now;
    checkPumpCommand();
  }

  // ── SLOW: send sensor data every SEND_INTERVAL ms ──
  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;
    sendCount++;

    float soilMoisture = readSoilMoisture();
    float temperature  = readTemperature();
    float humidity     = readHumidity();
    bool  rainDetected = readRainSensor();

    // Skip if DHT failed
    if (temperature < -900 || humidity < -900) {
      Serial.println("⚠️  DHT read failed — skipping cycle\n");
      return;
    }

    Serial.println("┌──────────────────────────────────────┐");
    Serial.println("│  📊 SENSOR READINGS  #" + String(sendCount));
    Serial.println("├──────────────────────────────────────┤");
    Serial.println("│  💧 Soil Moisture : " + String(soilMoisture, 1) + " %");
    Serial.println("│  🌡️  Temperature   : " + String(temperature, 1) + " °C");
    Serial.println("│  💨 Humidity      : " + String(humidity, 1) + " %");
    Serial.println("│  🌧️  Rain          : " + String(rainDetected ? "YES ☔" : "NO  ☀️"));
    Serial.println("│  🚰 Pump Status   : " + pumpStatus);
    Serial.println("├──────────────────────────────────────┤");

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
  long total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(SOIL_MOISTURE_PIN);
    delay(5);
  }
  int raw = total / 10;
  float moisture = map(raw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100);
  moisture = constrain(moisture, 0.0, 100.0);
  Serial.println("│  [RAW] Soil ADC   : " + String(raw) + " → " + String(moisture, 1) + "%");
  return moisture;
}

float readTemperature() {
  float temp = dht.readTemperature();
  for (int i = 0; i < 3 && isnan(temp); i++) {
    delay(500);
    temp = dht.readTemperature();
  }
  return isnan(temp) ? -999.0 : temp;
}

float readHumidity() {
  float hum = dht.readHumidity();
  for (int i = 0; i < 3 && isnan(hum); i++) {
    delay(500);
    hum = dht.readHumidity();
  }
  return isnan(hum) ? -999.0 : hum;
}

bool readRainSensor() {
  return digitalRead(RAIN_SENSOR_PIN) == LOW;
}

// ============================================
// NETWORK FUNCTIONS
// ============================================

void connectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
  }
}

// ── Send sensor data; backend replies with pump command ──
void sendToBackend(float moisture, float temp, float hum, bool rain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("│  ❌ WiFi not connected — skipping send");
    backendReachable = false;
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  JsonDocument doc;
  doc["deviceId"]      = DEVICE_ID;
  doc["soil_moisture"] = round(moisture * 10) / 10.0;
  doc["temperature"]   = round(temp * 10) / 10.0;
  doc["humidity"]      = round(hum * 10) / 10.0;
  doc["rain_status"]   = rain;
  doc["pump_status"]   = pumpStatus;

  String payload;
  serializeJson(doc, payload);
  Serial.println("│  📤 Sending: " + payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("│  📥 Response (" + String(httpCode) + "): " + response);

    JsonDocument res;
    if (!deserializeJson(res, response)) {
      if (res.containsKey("pump")) {
        String cmd = res["pump"].as<String>();
        setRelay(cmd);   // drives relay from sensor POST response
      }
    }
    backendReachable = true;
    failedAttempts = 0;
  } else {
    failedAttempts++;
    Serial.println("│  ❌ HTTP Error: " + String(httpCode) + " (attempt " + String(failedAttempts) + ")");
    backendReachable = false;
  }

  http.end();
}

// ── Fast GET /api/pump/status → drives relay within 300ms of any app command ──
void checkPumpCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_URL);
  url = url.substring(0, url.indexOf("/api/")) + "/api/pump/status?deviceId=" + DEVICE_ID;

  http.begin(url);
  http.setTimeout(2000);

  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    JsonDocument doc;
    if (!deserializeJson(doc, response) && doc["success"] == true) {
      String cmd = doc["data"]["pump_status"].as<String>();
      // Only toggle relay if state actually changed
      if (cmd == "ON" && pumpStatus != "ON") {
        setRelay("ON");
      } else if (cmd == "OFF" && pumpStatus != "OFF") {
        setRelay("OFF");
      }
    }
  }

  http.end();
}
