import { EventEmitter } from '@zeainc/zea-engine'

/** Class representing a gear parameter.
 * @extends BaseTrack
 */
class BaseTrack extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.keys = []
    this.__sampleCache = {}
  }

  addKey(time, value) {
    let index
    if (this.keys.length == 0 || time < this.keys[0].time) {
      this.keys.splice(0, 0, { time, value })
      index = 0
    } else {
      const numKeys = this.keys.length
      if (time > this.keys[numKeys - 1].time) {
        this.keys.push({ time, value })
        index = numKeys
      } else {
        // Find the first key after the specified time value
        for (let i = 1; i < numKeys; i++) {
          const key = this.keys[i]
          if (key.time > time) {
            this.keys.splice(i, 0, { time, value })
            index = i
            break
          }
        }
      }
    }

    this.emit('keyAdded', { index })
    return index
  }

  findKeyAndLerp(time) {
    if (time <= this.keys[0].time) {
      return {
        keyIndex: 0,
        lerp: 0
      }
    }
    const numKeys = this.keys.length
    if (time >= this.keys[numKeys - 1].time) {
      return {
        keyIndex: numKeys - 1,
        lerp: 0
      }
    }
    // Find the first key after the specified time value
    for (let i = 1; i < numKeys; i++) {
      const key = this.keys[i]
      if (key.time > time) {
        const prevKey = this.keys[i - 1]
        const delta = key.time - prevKey.time
        return {
          keyIndex: i - 1,
          lerp: (time - prevKey.time) / delta
        }
      }
    }
  }

  evaluate(time) {
    const keyAndLerp = this.findKeyAndLerp(time)
  }
}

export { BaseTrack }
