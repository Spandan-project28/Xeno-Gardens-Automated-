// ============================================
// ESP8266 IoT Smart Drip Irrigation — Config
// ============================================
// Edit this file for WiFi, pins, server URL,
// calibration, and thresholds.
// ============================================

#ifndef CONFIG_H
#define CONFIG_H

// ---- WiFi Credentials ----
// CHANGE THESE to your WiFi network
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// ---- Backend Server ----
// CHANGE the IP to your PC's local IP (run 'ipconfig' to find it)
// The port should match your backend's PORT in .env (default 5000)
#define SERVER_URL      "http://192.168.1.100:5000/api/sensor-data"
#define DEVICE_ID       "esp32-field-01"

// ---- Timing (milliseconds) ----
#define SEND_INTERVAL   30000    // Send data every 30 seconds
#define WIFI_TIMEOUT    15000    // WiFi connection timeout
#define HTTP_TIMEOUT    10000    // HTTP request timeout

// ---- Sensor Pins (ESP8266 NodeMCU) ----
// DHT11:          Signal → D4 (GPIO2)
// Soil Moisture:  A0     → A0 (only analog pin on ESP8266)
// Rain Sensor:    D0     → D6 (GPIO12)
#define SOIL_MOISTURE_PIN   A0   // The only analog pin on ESP8266
#define DHT_PIN             D4   // GPIO2
#define RAIN_SENSOR_PIN     D6   // GPIO12

// ---- DHT Sensor Type ----
#define DHT_TYPE            DHT11

// ---- Pump / Relay ----
// CHANGE this to whichever GPIO your relay is connected to
#define PUMP_PIN            D5   // GPIO14 → Relay IN
#define PUMP_ON             HIGH // Set to LOW if your relay is active-low
#define PUMP_OFF            LOW  // Set to HIGH if your relay is active-low

// ---- Sensor Calibration ----
// ESP8266 ADC is 10-bit (0-1023), range 0V-3.3V
// Soil Moisture: raw ADC values (adjust after testing your sensor)
//   Dry sensor in air   → high ADC value  (around 1023)
//   Wet sensor in water → low ADC value   (around 300)
#define SOIL_DRY_VALUE      1023  // ADC reading when completely dry
#define SOIL_WET_VALUE      300   // ADC reading when fully wet

// ---- Local Fallback Thresholds ----
// Used ONLY when the backend server is unreachable
#define FALLBACK_MOISTURE_LOW    30   // Pump ON if moisture below this %
#define FALLBACK_MOISTURE_HIGH   40   // Pump OFF if moisture above this %
#define FALLBACK_TEMP_HIGH       30   // Pump ON only if temp above this °C

// ---- Debug ----
#define SERIAL_BAUD         115200
#define DEBUG_MODE          true  // Set to false to disable Serial prints

#endif
