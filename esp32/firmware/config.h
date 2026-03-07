// ============================================
// ESP32 IoT Drip Irrigation — Configuration
// ============================================
// Edit this file for WiFi, pins, server URL,
// calibration, and thresholds.
// ============================================

#ifndef CONFIG_H
#define CONFIG_H

// ---- WiFi Credentials ----
// ⚠️ CHANGE THESE to your WiFi network
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// ---- Backend Server ----
// ⚠️ CHANGE the IP to your PC's local IP (run 'ipconfig' in terminal)
// The port must match your backend's PORT in .env (default 5000)
#define SERVER_URL      "http://192.168.1.100:5000/api/sensor-data"
#define DEVICE_ID       "esp32-field-01"

// ---- Timing (milliseconds) ----
#define SEND_INTERVAL   30000    // Send data every 30 seconds
#define WIFI_TIMEOUT    15000    // WiFi connection timeout
#define HTTP_TIMEOUT    10000    // HTTP request timeout

// ============================================
// SENSOR PIN CONNECTIONS
// ============================================
//
//   ESP32 Pin    Sensor             Wire Color (typical)
//   ─────────    ──────             ────────────────────
//   GPIO 4       DHT11 Signal       Yellow / Data
//   GPIO 36      Soil Moisture A0   Analog output
//   GPIO 12      Rain Sensor D0     Digital output
//   GPIO 14      Relay IN           Signal
//
// ============================================

// ---- Sensor Pins ----
#define DHT_PIN             4    // GPIO4  → DHT11 Signal pin
#define SOIL_MOISTURE_PIN   36   // GPIO36 → Soil Moisture analog output (ADC1_CH0)
#define RAIN_SENSOR_PIN     12   // GPIO12 → Rain Sensor digital D0 output

// ---- DHT Sensor Type ----
#define DHT_TYPE            DHT11

// ---- Pump / Relay ----
#define PUMP_PIN            14   // GPIO14 → Relay module IN
#define PUMP_ON             HIGH // Set to LOW if your relay is active-low
#define PUMP_OFF            LOW  // Set to HIGH if your relay is active-low

// ---- Sensor Calibration ----
// ESP32 ADC is 12-bit (0-4095)
// Soil Moisture: raw ADC values (adjust after testing your sensor)
//   Stick sensor in AIR   → note the reading (likely ~4095) = DRY
//   Stick sensor in WATER → note the reading (likely ~1200) = WET
#define SOIL_DRY_VALUE      4095  // ADC when completely dry
#define SOIL_WET_VALUE      1200  // ADC when fully wet

// ---- Local Fallback Thresholds ----
// Used ONLY when backend server is unreachable
#define FALLBACK_MOISTURE_LOW    30   // Pump ON if moisture below this %
#define FALLBACK_MOISTURE_HIGH   40   // Pump OFF if moisture above this %
#define FALLBACK_TEMP_HIGH       30   // Pump ON only if temp above this °C

// ---- Debug ----
#define SERIAL_BAUD         115200
#define DEBUG_MODE          true  // Set to false to disable Serial prints

#endif
