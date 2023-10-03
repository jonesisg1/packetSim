let packet: [string, number];

// Defaults from spec. Should be in ini / config file.
const pi: number = 3.141592653589793;
const defaultTemp: number = 20;
const defaultTempCompensationMap: Map<string, number> = new Map([
  ['A', 0.0495],
  ['B', 0.0486],
  ['C', 0.044]
]);

interface sensorData {
  radious: number, depth: number, prevRadious: number, voidDepth: number
}

export const calculateVolume = (sd: sensorData): number => {
  let volume: number =  sd.depth * pi * Math.pow(sd.radious, 2);
  // Handle voids above using average.
  if(sd.voidDepth > 0) {
    volume += sd.voidDepth * pi * Math.pow((sd.radious + sd.prevRadious) / 2, 2);
  }
  return volume;
}

export const calculateConeVol = (sd: sensorData): number => {
  let coneVol: number = 0;
  if(sd.prevRadious !== 0) {
    coneVol = (sd.depth * pi * (Math.pow(sd.radious, 2) + sd.radious * sd.prevRadious + Math.pow(sd.prevRadious, 2))) / 3;
  }  
  return coneVol;
}

export function packetSimulation(dataStream: Array<typeof packet>, calcFunc: (arg: sensorData) => number): number {
  // console.log(dataStream);
  /* Assume 
   * One sensor, one data value. ['SensorType', Value]
   * Order of data is fixed but packets may be dropped.
   * Sensor Types: (D)epth, (T)emp, Callipers: (A), (B), (C)
   * Foating point rounding errors are acceptable.  If not mathjs can be used.
   * Volume output to 10 d.p. (to make testing easier)
   */
  const anEngine = new analysisEngine(defaultTempCompensationMap, calcFunc);
  for (const packet of dataStream) {
    anEngine.processPacket(packet);
  }
  return anEngine.volume;
}

class analysisEngine {
  #temperatureCompensationMap: Map<string, number>;
  #volume: number = 0;
  #prevDepth: number = 0;
  #depth: number = 0;
  #temperature: number = defaultTemp;
  #calliperReadings: number[] = [];
  #prevAvgRadious: number = 0;
  #voidDepth: number = 0;
  #calcFunc: (arg: sensorData) => number;
  constructor(temperatureCompensation: Map<string, number>, calcFunc: (arg: sensorData) => number) {
    this.#temperatureCompensationMap = temperatureCompensation
    this.#calcFunc = calcFunc
  }

  get volume() :number {
    if(this.#calliperReadings.length > 0){
      this.#doCalculations();
    }
    return Number(this.#volume.toFixed(10));
  }

  processPacket(packet: [string, number]) {
    const [sensor, value] = packet;
    switch(sensor) {
      case 'D':
        this.#doCalculations();
        this.#prevDepth = this.#depth;
        this.#depth = value;
        break;
      case 'T':
        this.#temperature = value;
        break;
      default:
        this.#calliperReadings.push(this.#temperature * (this.#temperatureCompensationMap.get(sensor) || 1) * value);
    }
  }

  #doCalculations() {
    const depthDelta: number = this.#depth - this.#prevDepth;
    if(depthDelta === 0) {
      return;  // No change in depth. Our first depth measurement.
    }
    if(this.#calliperReadings.length === 0) {
      this.#voidDepth = depthDelta;
      return;  // No readings at this depth.
    }

    const avgRadious: number = this.#averageRadious();
    this.#volume += this.#calcFunc({ radious: avgRadious, depth: depthDelta, prevRadious: this.#prevAvgRadious, voidDepth: this.#voidDepth });

    if(this.#voidDepth > 0) {
      this.#voidDepth = 0;
    }
    this.#prevAvgRadious = avgRadious;
    this.#calliperReadings = [];
  }

  #averageRadious(): number {
    const sumOfReadings: number = this.#calliperReadings.reduce((prev, current) => (prev || 0) + current);
    return sumOfReadings / this.#calliperReadings.length;
  }
}