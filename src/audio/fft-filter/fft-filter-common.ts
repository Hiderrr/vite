export const FFT_SIZE = 2048;

export class Range {
  start: number;
  end: number;
  constructor(start: number, end: number) {
    this.start = start, this.end = end;
  }
}

export interface FftFilterMessageEventData {
  audible_ranges: Range[];
  fft_size: number;
}