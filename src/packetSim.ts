let packet: [string, number];
export enum VolType {
  Cylinder,
  Cone
}

// Defaults from spec. Should be in ini / config file.
const pi: number = 3.141592653589793;
const defaultTemp: number = 20;
const defaultTempCompensationMap: Map<string, number> = new Map([
  ['A', 0.0495],
  ['B', 0.0486],
  ['C', 0.044]
]);

export function packetSimulation(dataStream: Array<typeof packet>, volType: VolType = VolType.Cylinder): number {
  // console.log(dataStream);
  /* Assume 
   * One sensor, one data value. ['SensorType', Value]
   * Order of data is fixed but packets may be dropped.
   * Sensor Types: (D)epth, (T)emp, Callipers: (A), (B), (C)
   * Foating point rounding errors are acceptable.  If not mathjs can be used.
   * Volume output to 10 d.p. (to make testing easier)
   */
  const anEngine = new analysisEngine(defaultTempCompensationMap);
  for (const packet of dataStream) {
    anEngine.processPacket(packet);
  }
  return (volType === VolType.Cylinder) ? anEngine.volume : anEngine.coneVol;
}

class analysisEngine {
  #temperatureCompensationMap: Map<string, number>;
  #volume: number = 0;
  #coneVol: number = 0;
  #prevDepth: number = 0;
  #depth: number = 0;
  #temperature: number = defaultTemp;
  #calliperReadings: number[] = [];
  #prevAvgRadious: number = 0;
  #voidDepth: number = 0;
  constructor(temperatureCompensation: Map<string, number>) {
    this.#temperatureCompensationMap = temperatureCompensation
  }

  get volume() :number {
    if(this.#calliperReadings.length > 0){
      this.#doCalculations();
    }
    return Number(this.#volume.toFixed(10));
  }
  get coneVol():number {
    if(this.#calliperReadings.length > 0){
      this.#doCalculations();
    }
    return Number(this.#coneVol.toFixed(6));
  }

  processPacket(packet: [string, number]) {
    // console.log(packet);
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
      case 'A':
      case 'B':
      case 'C':
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

    const avgRadious = this.#averageRadious();
    this.#volume += this.#calculateVolume(avgRadious, depthDelta);
    this.#coneVol += this.#calculateConeVol(avgRadious, depthDelta);

    this.#prevAvgRadious = avgRadious;
    this.#calliperReadings = [];
  }

  #averageRadious(): number {
    const sumOfReadings = this.#calliperReadings.reduce((prev, current) => (prev || 0) + current);
    return sumOfReadings / this.#calliperReadings.length;
  }

  #calculateVolume(avgRadious: number, depthDelta: number): number {
    let volume =  depthDelta * pi * Math.pow(avgRadious, 2);
    // Handle voids above using average.
    if(this.#voidDepth > 0) {
      volume += this.#voidDepth * pi * Math.pow((avgRadious + this.#prevAvgRadious) / 2, 2);
      this.#voidDepth = 0;
    }
    return volume;
  }

  #calculateConeVol(avgRadious: number, depthDelta: number): number {
    let coneVol: number = 0;
    if(this.#prevAvgRadious !== 0) {
      coneVol =  (depthDelta * pi * (Math.pow(avgRadious, 2) + avgRadious * this.#prevAvgRadious + Math.pow(this.#prevAvgRadious, 2))) / 3;
    }  
    return coneVol;
  }
}