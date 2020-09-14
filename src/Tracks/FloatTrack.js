import { MathFunctions } from '@zeainc/zea-engine'
import { BaseTrack } from './BaseTrack'

class FloatTrack extends BaseTrack {
  constructor(name) {
    super(name)

    this.valueRef = new Xfo()
  }

  evaluate(time) {
    const keyAndLerp = this.findKeyAndLerp(time)

    const value0 = this.keys[keyAndLerp.keyIndex].value
    if (keyAndLerp.lerp > 0.0) {
      const value1 = this.keys[keyAndLerp.keyIndex].value
      return MathFunctions.lerp(value0, value1, keyAndLerp.lerp)
    } else {
      return value0
    }
  }
}

export { FloatTrack }
