import DeviceDetector from "device-detector-js";

// from: https://codepen.io/mediapipe/pen/LYRRYEw
// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
export function testSupport(
    supportedDevices: { client?: string; os?: string }[]
) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);

    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }

    if (!isSupported) {
        alert(
            `This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
                `is not well supported at this time, continue at your own risk.`
        );
    }
}
