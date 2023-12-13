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