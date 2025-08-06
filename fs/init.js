load('api_adc.js');
load('api_config.js');
load('api_timer.js');
load('api_arduino_ssd1306.js');
load('api_sys.js');

let THERMISTOR_GPIO = 36;
let NUM_TEMP_SAMPLES = 10;

let tempSamples = [];
let tempIndex = 0;

let format = ffi("int sprintf(char *, char *, double)");

let voltage = ffi('int mgos_adc_read_voltage(int)');

// Enable ADC on thermistor pin
ADC.enable(THERMISTOR_GPIO);

// Start sampling temperature
Timer.set(100, true, function () {
  tempSamples[tempIndex] = voltage(THERMISTOR_GPIO);
  tempIndex = (tempIndex + 1) % NUM_TEMP_SAMPLES;
}, null);

let getAverageVoltage = function () {
  let index;
  let cumulative = 0;
  for (index = 0; index < tempSamples.length; index++) {
    if (isNaN(tempSamples[index])) break;

    cumulative += tempSamples[index];
  }
  return cumulative / index;
};

// TODO length of wire extension has 1.5ohms of resistance
let getThermistorTemperature = function () {
    // They say readings are noisy and should be sampled, but it looks like we
    // are getting variances of about +/-0.15 Celsius per reading, which is
    // not enough to affect our practical use. So we are just taking one reading.
    // If this value needs to be scaled: https://github.com/e-tinkers/ntc-thermistor-with-arduino-and-esp32/blob/master/ntc_3950.ino
    let Vout = getAverageVoltage(); // Readings come in millivolts

    // Calculate using the Steinhart-Hart equation
    let Vs = 3280;    // Supply (thermistor unplugged) mV
    let B = 3950.0;   // Thermistor Beta coefficient
    let Ro = 10000.0; // Thermistor resistance at 25.0C
    let R1 = 10000.0; // Fixed resistor
    let To = 298.15;  // Temperature in Kelvin for 25 degree Celsius

    let Rt = 0;    // Calculated thermistor resistance
    let T, Tc = 0; // Calculated temperature in Kelvin, Celsius

    Rt = R1 * Vout / (Vs - Vout);             // Calculate thermistor resistance
    T = 1 / (1 / To + Math.log(Rt / Ro) / B); // Temperature in Kelvin
    Tc = T * 9/5 - 459.67;                    // Fahrenheit
    return Tc;
};

/////// Drawing stuff ////////

let iceFlashTimer = 0;

let drawText = function (str, size, x, y) {
  d.setTextSize(size);
  d.setTextColor(Adafruit_SSD1306.WHITE);
  d.setCursor(x, y);
  d.write(str);
};

// Initialize Adafruit_SSD1306 library (I2C)
let d = Adafruit_SSD1306.create_i2c(16 /* RST GPIO */, Adafruit_SSD1306.RES_128_64);
// Initialize the display.
d.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3C, true /* reset */);

// Display the temperature
Timer.set(1000, true, function () {
  let temp = getThermistorTemperature();
  let buf = '0000.0';
  let len = format(buf, '%.0f', temp);
  let tempString = buf.slice(0, len) + "F"; 
  print('Temperature:', tempString);

  d.clearDisplay();
  if (temp <= 34 && temp >= 28) {
    if (iceFlashTimer === 0) {
      drawText("*", 5, 0, d.height() / 4); 
    }
    iceFlashTimer = (iceFlashTimer + 1) % 2;
  }
  drawText(tempString, 5, d.width() / 4, d.height() / 4);
  d.display();
}, null);
