export class SoundMeter {
  private context: AudioContext;
  instant = 0.0;
  slow = 0.0;
  clip = 0.0;
  private script;
  private mic;

  constructor(context: AudioContext) {
    this.context = context;
    this.script = context.createScriptProcessor(2048, 1, 1);
    this.script.onaudioprocess = this.onaudioprocess.bind(this);
  }

  onaudioprocess(event: AudioProcessingEvent) {
    const input = event.inputBuffer.getChannelData(0);

    let i;
    let sum = 0.0;
    let clipCount = 0;
    for (i = 0; i < input.length; ++i) {
      sum += input[i] * input[i];
      if (Math.abs(input[i]) > 0.99) {
        clipCount += 1;
      }
    }
    this.instant = Math.sqrt(sum / input.length);
    this.slow = 0.95 * this.slow + 0.05 * this.instant;
    this.clip = clipCount / input.length;
  }

  connectToSource(stream, callback) {
    try {
      this.mic = this.context.createMediaStreamSource(stream);
      this.mic.connect(this.script);
      this.script.connect(this.context.destination);
      if (!!callback) {
        callback(null);
      }
    } catch (e) {
      if (!!callback) {
        callback(e);
      }
    }
  }

  stop() {
    this.mic.disconnect();
    this.script.disconnect();
  }
}
