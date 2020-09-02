import { Color } from '@zeainc/zea-engine'
import { BaseTrack } from './BaseTrack'

class ColorTrack extends BaseTrack {
  constructor(name) {
    super(name)
  }

  evaluate(time) {
    const keyAndLerp = this.findKeyAndLerp(time)

    const value0 = this.keys[keyAndLerp.keyIndex].value
    if (keyAndLerp.lerp > 0.0) {
      const value1 = this.keys[keyAndLerp.keyIndex + 1].value
      return value0.lerp(value1, keyAndLerp.lerp)
    } else {
      return value0
    }
  }
}

export { ColorTrack }
