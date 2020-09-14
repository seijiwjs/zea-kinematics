import { Xfo } from '@zeainc/zea-engine'
import { BaseTrack } from './BaseTrack'

class XfoTrack extends BaseTrack {
  constructor(name) {
    super(name)
  }

  evaluate(time) {
    const keyAndLerp = this.findKeyAndLerp(time)

    const value0 = this.keys[keyAndLerp.keyIndex].value
    if (keyAndLerp.lerp > 0.0) {
      const value1 = this.keys[keyAndLerp.keyIndex + 1].value
      const tr = value0.tr.lerp(value1.tr, keyAndLerp.lerp)
      const ori = value0.ori.lerp(value1.ori, keyAndLerp.lerp)
      return new Xfo(tr, ori)
    } else {
      return value0
    }
  }
}

export { XfoTrack }
