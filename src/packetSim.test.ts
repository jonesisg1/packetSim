import { packetSimulation } from "./packetSim";

test('10 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17]])).toBe(0.6878245193);
});

test('20 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17],['D',20],['T',21],['A',0.15],['B',0.16]])).toBe(1.4881613236);
});

test('30 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17],
                           ['D',20],['T',21],['A',0.15],['B',0.16],
                           ['D',30],['A',0.16],['B',0.18],['C',0.15],
                          ])).toBe(2.3215816014);
});

test('40 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17],
                           ['D',20],['T',21],['A',0.15],['B',0.16],
                           ['D',30],['A',0.16],['B',0.18],['C',0.15],
                           ['D',40],['T',22],['A',0.17]
                          ])).toBe(3.3983033241);
});

test('60 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17],
                           ['D',20],['T',21],['A',0.15],['B',0.16],
                           ['D',30],['A',0.16],['B',0.18],['C',0.15],
                           ['D',40],['T',22],['A',0.17],
                           ['D',50],['T',22],
                           ['D',60],['T',23],['A',0.18],['B',0.18],['C',0.15]
                          ])).toBe(5.5665709901);
});

test('70 m', () => {
  expect(packetSimulation([['D',10],['A',0.15],['B',0.15],['C',0.17],
                           ['D',20],['T',21],['A',0.15],['B',0.16],
                           ['D',30],['A',0.16],['B',0.18],['C',0.15],
                           ['D',40],['T',22],['A',0.17],
                           ['D',50],['T',22],
                           ['D',60],['T',23],['A',0.18],['B',0.18],['C',0.15],
                           ['D',70],['T',24],['A',0.15],['B',0.16],['C',0.16]
                          ])).toBe(6.5611481163);
});

test('PS 10 m', () => {
  expect(packetSimulation([['D',10],['T',19],['A',0.16],['C',0.14]])).toBe(0.562085514);
});

test('PS 20 m', () => {
  expect(packetSimulation([['D',10],['T',19],['A',0.16],['C',0.14],
                           ['D',20],['T',20],['A',0.16],['B',0.16],
                           ['D',30]],'C')).toBe(0.665213);
});

test('PS 20 m', () => {
  expect(packetSimulation([['D',10],['T',19],['A',0.16],['C',0.14],
                           ['D',20],['T',20],['A',0.16],['B',0.16],
                           ['D',30],['T',20],['A',0.17],['B',0.18],['C',0.15],
                           ['D',40]],'C')).toBe(1.446411);
});