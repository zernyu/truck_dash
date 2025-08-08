# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mongoose OS firmware project for a truck dashboard display that monitors temperature using a thermistor and displays it on an SSD1306 OLED screen. The system runs on an ESP32 microcontroller and is built using the Mongoose OS platform with JavaScript.

## Architecture

- **Platform**: Mongoose OS (IoT firmware framework)
- **Language**: JavaScript (MJS - Mongoose JavaScript engine)
- **Hardware**: ESP32 with SSD1306 OLED display and thermistor sensor
- **Main application**: `fs/init.js` - contains all application logic

### Core Components

1. **Temperature Sensing**: Uses a thermistor connected to GPIO 36 with voltage divider circuit
2. **Display**: SSD1306 128x64 OLED display connected via I2C (SDA: GPIO 4, SCL: GPIO 15)
3. **Temperature Calculation**: Implements Steinhart-Hart equation for accurate temperature conversion
4. **Sampling**: Collects 10 temperature samples every 100ms and averages them
5. **Display Updates**: Updates display every 1000ms with current temperature in Fahrenheit
6. **Ice Warning**: Flashes asterisk when temperature is between 28-34°F

## Common Development Commands

### Building the Project
```bash
mos build
```

### Flashing to Device
```bash
mos flash
```

### Serial Console Monitoring
```bash
mos console
```

### Clean Build
```bash
mos build --clean
```

## Configuration

- I2C is enabled with SDA on GPIO 4 and SCL on GPIO 15
- Project configuration is defined in `mos.yml`
- Uses custom ADC library from https://github.com/zernyu/adc
- Uses custom SSD1306 library from https://github.com/zernyu/arduino-adafruit-ssd1306

## Hardware Constants

- Thermistor GPIO: 36
- Thermistor Beta coefficient: 3950
- Reference resistor: 10kΩ
- Supply voltage: 3.28V
- Display I2C address: 0x3C
- Display reset GPIO: 16

## Temperature Calculation

The system uses the Steinhart-Hart equation with these parameters:
- Beta (B): 3950.0
- Reference resistance (Ro): 10kΩ at 25°C
- Reference temperature (To): 298.15K (25°C)

Temperature is converted to Fahrenheit for display: `T * 9/5 - 459.67`

## Future Development: Bluetooth Audio Relay

### Project Vision
Planning to evolve this project into a Bluetooth audio relay system for 2008 Toyota Tacoma. The goal is to allow multiple phones to connect and share audio through the existing Crux BTS-TY1 Bluetooth adapter without manual device switching.

### Key Findings from Research
- **ESP32 Limitation**: Cannot simultaneously function as A2DP sink and source on single module
- **Existing Crux Adapter**: BTS-TY1 (not hackable, single connection only)
- **No Commercial Solutions**: True Bluetooth-to-Bluetooth relay devices don't exist commercially
- **Framework Change Required**: Must migrate from Mongoose OS to Arduino/ESP-IDF for A2DP support

### Proposed Architecture
- **Dual ESP32 Setup**: 
  - ESP32 #1: Multi-device A2DP sink (receives from phones)
  - ESP32 #2: A2DP source (transmits to existing Crux adapter)
  - Audio bridge between modules (I2S or serial audio)
- **Priority Logic**: First active audio source gets exclusive relay
- **Status Indication**: LED patterns for connection/streaming status

### Technical Requirements
- Arduino/ESP-IDF framework (ESP32-A2DP library support)
- Bluetooth Classic A2DP profile implementation
- Audio quality preservation (<100ms latency)
- Integration with existing vehicle electrical system

### Development Status
- Research phase completed (August 2025)
- Implementation pending future development cycle
- PRD available in `esp32_bluetooth_relay_prd.md`