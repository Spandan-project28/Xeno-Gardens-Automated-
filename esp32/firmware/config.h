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
#define WIFI_SSID       "T5-018"
#define WIFI_PASSWORD   "t5018@123"

// ---- Backend Server ----
// ⚠️ CHANGE the IP to your PC's local IP (run 'ipconfig' in terminal)
// The port must match your backend's PORT in .env (default 5000)
#define SERVER_URL      "http://192.168.0.100:5000/api/sensor-data"
#define DEVICE_ID       "esp32-field-01"

// ---- Timing (milliseconds) ----
#define SEND_INTERVAL   1000     // Send data every 1 second
#define WIFI_TIMEOUT    15000    // WiFi connection timeout
#define HTTP_TIMEOUT    10000    // HTTP request timeout

// ============================================
// SENSOR PIN CONNECTIONS (NO RELAY)
// ============================================
//
//   ESP32 Pin    Sensor             Wire
//   ─────────    ──────             ────
//   GPIO 4       DHT11 Signal       Data
//   GPIO 34      Soil Moisture A0   Analog
//   GPIO 27      Rain Sensor D0     Digital
//
// ============================================

// ---- Sensor Pins ----
#define DHT_PIN             4    // GPIO4  → DHT11 Signal pin
#define SOIL_MOISTURE_PIN   34   // GPIO34 → Soil Moisture analog output
#define RAIN_SENSOR_PIN     27   // GPIO27 → Rain Sensor digital D0 output

// ---- DHT Sensor Type ----
#define DHT_TYPE            DHT11

// ---- Sensor Calibration ----
// ESP32 ADC is 12-bit (0-4095)
// Soil Moisture: raw ADC values (adjust after testing your sensor)
//   Stick sensor in AIR   → note the reading (likely ~4095) = DRY
//   Stick sensor in WATER → note the reading (likely ~1200) = WET
#define SOIL_DRY_VALUE      4095  // ADC when completely dry
#define SOIL_WET_VALUE      1200  // ADC when fully wet

// ---- Debug ----
#define SERIAL_BAUD         115200
#define DEBUG_MODE          true  // Set to false to disable Serial prints

#endif
