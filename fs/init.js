load('api_adc.js');
load('api_config.js');
load('api_timer.js');
load('api_sys.js');

let THERMISTOR_GPIO = 36;
let NUM_TEMP_SAMPLES = 20;

let tempSamples = [];
let tempIndex = 0;

let format = ffi("int sprintf(char *, char *, double)");

let voltage = ffi('int mgos_adc_read_voltage(int)');

let getAverageVoltage = function () {
  let index;
  let cumulative = 0;
  for (index = 0; index < tempSamples.length; index++) {
    if (isNaN(tempSamples[index])) break;

    cumulative += tempSamples[index];
  }
  return cumulative / index;
};

let getThermistorTemperature = function () {
    // They say readings are noisy and should be sampled, but it looks like we
    // are getting variances of about +/-0.15 Celsius per reading, which is
    // not enough to affect our practical use. So we are just taking one reading.
    // If this value needs to be scaled: https://github.com/e-tinkers/ntc-thermistor-with-arduino-and-esp32/blob/master/ntc_3950.ino
    let Vout = getAverageVoltage(); // Readings come in millivolts

    // Calculate using the Steinhart-Hart equation
    let Vs = 3134;    // Supply (thermistor unplugged) mV
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

ADC.enable(THERMISTOR_GPIO);

Timer.set(500, true, function () {
  let buf = '0000.0';
  let len = format(buf, '%.1f', getThermistorTemperature());
  print('Temperature:', buf.slice(0, len));
}, null);

Timer.set(100, true, function () {
  tempSamples[tempIndex] = voltage(THERMISTOR_GPIO);
  tempIndex = (tempIndex + 1) % NUM_TEMP_SAMPLES;
}, null);
