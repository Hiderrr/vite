function transform(real, imag) {
  const n = real.length;
  if (n != imag.length)
    throw new RangeError("Mismatched lengths");
  if (n == 0)
    return;
  else if ((n & n - 1) == 0)
    transformRadix2(real, imag);
  else
    transformBluestein(real, imag);
}
function inverseTransform(real, imag) {
  transform(imag, real);
}
function transformRadix2(real, imag) {
  const n = real.length;
  if (n != imag.length)
    throw new RangeError("Mismatched lengths");
  if (n == 1)
    return;
  let levels = -1;
  for (let i = 0; i < 32; i++) {
    if (1 << i == n)
      levels = i;
  }
  if (levels == -1)
    throw new RangeError("Length is not a power of 2");
  const cosTable = new Array(n / 2);
  const sinTable = new Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cosTable[i] = Math.cos(2 * Math.PI * i / n);
    sinTable[i] = Math.sin(2 * Math.PI * i / n);
  }
  for (let i = 0; i < n; i++) {
    const j = reverseBits(i, levels);
    if (j > i) {
      let temp = real[i];
      real[i] = real[j];
      real[j] = temp;
      temp = imag[i];
      imag[i] = imag[j];
      imag[j] = temp;
    }
  }
  for (let size = 2; size <= n; size *= 2) {
    const halfsize = size / 2;
    const tablestep = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
        const l = j + halfsize;
        const tpre = real[l] * cosTable[k] + imag[l] * sinTable[k];
        const tpim = -real[l] * sinTable[k] + imag[l] * cosTable[k];
        real[l] = real[j] - tpre;
        imag[l] = imag[j] - tpim;
        real[j] += tpre;
        imag[j] += tpim;
      }
    }
  }
  function reverseBits(val, width) {
    let result = 0;
    for (let i = 0; i < width; i++) {
      result = result << 1 | val & 1;
      val >>>= 1;
    }
    return result;
  }
}
function transformBluestein(real, imag) {
  const n = real.length;
  if (n != imag.length)
    throw new RangeError("Mismatched lengths");
  let m = 1;
  while (m < n * 2 + 1)
    m *= 2;
  const cosTable = new Array(n);
  const sinTable = new Array(n);
  for (let i = 0; i < n; i++) {
    const j = i * i % (n * 2);
    cosTable[i] = Math.cos(Math.PI * j / n);
    sinTable[i] = Math.sin(Math.PI * j / n);
  }
  const areal = newArrayOfZeros(m);
  const aimag = newArrayOfZeros(m);
  for (let i = 0; i < n; i++) {
    areal[i] = real[i] * cosTable[i] + imag[i] * sinTable[i];
    aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
  }
  const breal = newArrayOfZeros(m);
  const bimag = newArrayOfZeros(m);
  breal[0] = cosTable[0];
  bimag[0] = sinTable[0];
  for (let i = 1; i < n; i++) {
    breal[i] = breal[m - i] = cosTable[i];
    bimag[i] = bimag[m - i] = sinTable[i];
  }
  const creal = new Array(m);
  const cimag = new Array(m);
  convolveComplex(areal, aimag, breal, bimag, creal, cimag);
  for (let i = 0; i < n; i++) {
    real[i] = creal[i] * cosTable[i] + cimag[i] * sinTable[i];
    imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
  }
}
function convolveComplex(xreal, ximag, yreal, yimag, outreal, outimag) {
  const n = xreal.length;
  if (n != ximag.length || n != yreal.length || n != yimag.length || n != outreal.length || n != outimag.length)
    throw new RangeError("Mismatched lengths");
  xreal = xreal.slice();
  ximag = ximag.slice();
  yreal = yreal.slice();
  yimag = yimag.slice();
  transform(xreal, ximag);
  transform(yreal, yimag);
  for (let i = 0; i < n; i++) {
    const temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
    ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
    xreal[i] = temp;
  }
  inverseTransform(xreal, ximag);
  for (let i = 0; i < n; i++) {
    outreal[i] = xreal[i] / n;
    outimag[i] = ximag[i] / n;
  }
}
function newArrayOfZeros(n) {
  const result = [];
  for (let i = 0; i < n; i++)
    result.push(0);
  return result;
}

const sinc = (n) => Math.sin(Math.PI * n) / (Math.PI * n);
const bessi0 = (x) => {
  const ax = Math.abs(x);
  if (ax < 3.75) {
    const y = x / 3.75 * (x / 3.75);
    return 1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 45813e-7)))));
  } else {
    const y = 3.75 / ax;
    return Math.exp(ax) / Math.sqrt(ax) * (0.39894228 + y * (0.01328592 + y * (225319e-8 + y * (-157565e-8 + y * (916281e-8 + y * (-0.02057706 + y * (0.02635537 + y * (-0.01647633 + y * 392377e-8))))))));
  }
};
const windows = {
  hann: (n, points) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (points - 1)),
  hamming: (n, points) => 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (points - 1)),
  cosine: (n, points) => Math.sin(Math.PI * n / (points - 1)),
  lanczos: (n, points) => sinc(2 * n / (points - 1) - 1),
  gaussian: (n, points, alpha = 0.4) => {
    return Math.pow(
      Math.E,
      -0.5 * Math.pow((n - (points - 1) / 2) / (alpha * (points - 1) / 2), 2)
    );
  },
  tukey: (n, points, alpha = 0.5) => {
    if (n < 0.5 * alpha * (points - 1)) {
      return 0.5 * (1 + Math.cos(Math.PI * (2 * n / (alpha * (points - 1)) - 1)));
    } else if (n < (1 - 0.5 * alpha) * (points - 1)) {
      return 1;
    } else {
      return 0.5 * (1 + Math.cos(
        Math.PI * (2 * n / (alpha * (points - 1)) + 1 - 2 / alpha)
      ));
    }
  },
  blackman: (n, points) => {
    return 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (points - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (points - 1));
  },
  exact_blackman: (n, points) => {
    return 0.4243801 - 0.4973406 * Math.cos(2 * Math.PI * n / (points - 1)) + 0.0782793 * Math.cos(4 * Math.PI * n / (points - 1));
  },
  kaiser: (n, points, alpha = 3) => {
    return bessi0(
      Math.PI * alpha * Math.sqrt(1 - Math.pow(2 * n / (points - 1) - 1, 2))
    ) / bessi0(Math.PI * alpha);
  },
  nuttall: (n, points) => {
    return 0.355768 - 0.487396 * Math.cos(2 * Math.PI * n / (points - 1)) + 0.144232 * Math.cos(4 * Math.PI * n / (points - 1)) - 0.012604 * Math.cos(6 * Math.PI * n / (points - 1));
  },
  blackman_harris: (n, points) => {
    return 0.35875 - 0.48829 * Math.cos(2 * Math.PI * n / (points - 1)) + 0.14128 * Math.cos(4 * Math.PI * n / (points - 1)) - 0.01168 * Math.cos(6 * Math.PI * n / (points - 1));
  },
  blackman_nuttall: (n, points) => {
    return 0.3635819 - 0.3635819 * Math.cos(2 * Math.PI * n / (points - 1)) + 0.1365995 * Math.cos(4 * Math.PI * n / (points - 1)) - 0.0106411 * Math.cos(6 * Math.PI * n / (points - 1));
  },
  flat_top: (n, points) => {
    return 1 - 1.93 * Math.cos(2 * Math.PI * n / (points - 1)) + 1.29 * Math.cos(4 * Math.PI * n / (points - 1)) - 0.388 * Math.cos(6 * Math.PI * n / (points - 1)) + 0.032 * Math.cos(8 * Math.PI * n / (points - 1));
  }
};
const applyWindowFunction = (data_array, windowing_function, alpha) => {
  const datapoints = data_array.length;
  for (let n = 0; n < datapoints; ++n) {
    data_array[n] *= windowing_function(n, datapoints, alpha);
  }
  return data_array;
};
const create_window_function = (win) => (array, alpha) => applyWindowFunction(array, windows[win], alpha);
const hann = create_window_function("hann");

class Queue {
  maxSize;
  loop;
  data;
  size;
  toProduce;
  toConsume;
  constructor(maxSize, loop = false) {
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new Error("Invalid parameter");
    }
    this.maxSize = maxSize;
    this.loop = loop;
    this.data = new Array(maxSize);
    this.clear();
  }
  push(value) {
    if (this.size >= this.maxSize) {
      if (!this.loop) {
        throw new Error("Queue overflow");
      }
      this.pop();
    }
    this.data[this.toProduce] = value;
    if (++this.toProduce >= this.maxSize) {
      this.toProduce = 0;
    }
    ++this.size;
  }
  pop() {
    if (this.size <= 0) {
      throw new Error("Queue empty");
    }
    const value = this.data[this.toConsume];
    if (++this.toConsume >= this.maxSize) {
      this.toConsume = 0;
    }
    --this.size;
    return value;
  }
  top() {
    if (this.size <= 0) {
      return void 0;
    }
    return this.data[this.toConsume];
  }
  getSize() {
    return this.size;
  }
  isEmpty() {
    return this.size <= 0;
  }
  clear() {
    this.size = this.toProduce = this.toConsume = 0;
  }
  [Symbol.iterator]() {
    const maxSize = this.maxSize;
    const data = this.data;
    let size = this.size;
    let toConsume = this.toConsume;
    return {
      next() {
        if (size <= 0) {
          return {
            done: true,
            value: null
          };
        }
        const value = data[toConsume];
        if (++toConsume >= maxSize) {
          toConsume = 0;
        }
        --size;
        return {
          done: false,
          value
        };
      }
    };
  }
}

const FFT_SIZE = 2048;

class FFtFilterProcessor extends AudioWorkletProcessor {
  // actual filter settings
  audible_ranges = [];
  // fft things
  real = new Float64Array(FFT_SIZE);
  imag = new Float64Array(FFT_SIZE).fill(0);
  last_iteration = new Float64Array(FFT_SIZE / 2).fill(0);
  prev_time = 0;
  // buffer of samples waiting for fft
  buff = new Queue(5 * FFT_SIZE, true);
  // big max size limit, so that I don't have to think
  // buffer of ready samples waiting to be fed to Web Audio
  ready = new Queue(5 * FFT_SIZE, true);
  // same here
  constructor() {
    super();
    this.port.onmessage = (event) => {
      const fft_data = event.data;
      if (fft_data.audible_ranges) {
        this.audible_ranges = fft_data.audible_ranges;
      }
    };
  }
  process(inputs, outputs, parameters) {
    if (inputs.length === 0)
      return false;
    if (inputs[0].length === 0)
      return false;
    const input_channel = inputs[0][0];
    const n = input_channel.length;
    for (let i = 0; i < n; i++) {
      this.buff.push(input_channel[i]);
    }
    while (this.buff.getSize() >= FFT_SIZE) {
      for (let i = 0; i < FFT_SIZE / 2; i++) {
        this.real[i] = this.buff.pop();
        this.imag[i] = 0;
      }
      {
        let i = 0;
        for (const sample of this.buff) {
          this.real[FFT_SIZE / 2 + i] = sample;
          this.imag[FFT_SIZE / 2 + i] = 0;
          if (++i >= FFT_SIZE / 2)
            break;
        }
      }
      hann(this.real);
      transform(this.real, this.imag);
      for (let i = 0; i < FFT_SIZE; i++) {
        const audio_freq = i * sampleRate / FFT_SIZE;
        let found = this.audible_ranges.length === 0;
        for (const r of this.audible_ranges) {
          if (audio_freq >= r.start && audio_freq <= r.end) {
            found = true;
            break;
          }
        }
        if (!found) {
          this.real[i] = this.imag[i] = 0;
        }
      }
      if (currentTime - this.prev_time > 1 / 60) {
        this.port.postMessage({ real: this.real.subarray(0, FFT_SIZE / 2), imag: this.imag.subarray(0, FFT_SIZE / 2) });
        this.prev_time = currentTime;
      }
      inverseTransform(this.real, this.imag);
      for (let i = 0; i < FFT_SIZE / 2; i++) {
        const hanned_sample = this.last_iteration[i] + this.real[i] / FFT_SIZE;
        this.ready.push(hanned_sample);
      }
      for (let i = 0; i < FFT_SIZE / 2; i++) {
        this.last_iteration[i] = this.real[FFT_SIZE / 2 + i] / FFT_SIZE;
      }
    }
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < outputs.length; k++) {
        const sample = this.ready.isEmpty() ? 0 : this.ready.pop();
        for (let channel = 0; channel < outputs[k].length; channel++) {
          outputs[k][channel][i] = sample;
        }
      }
    }
    return true;
  }
}
registerProcessor("fft-filter", FFtFilterProcessor);
