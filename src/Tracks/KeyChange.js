import { Change, UndoRedoManager } from '@zeainc/zea-ux'

class KeyChange extends Change {
  constructor(track, index, value) {
    super()
    this.track = track
    this.index = index
    this.prevValue = this.track.getKeyValue(this.index)
    this.newValue = value
    this.track.setKeyValue(this.index, value)
  }

  update(value) {
    this.newValue = value
    this.track.setKeyValue(this.index, this.newValue)
  }

  undo() {
    this.track.setKeyValue(this.index, this.prevValue)
  }

  redo() {
    this.track.setKeyValue(this.index, this.newValue)
  }
}

UndoRedoManager.registerChange('KeyChange', KeyChange)

export default KeyChange
export { KeyChange }
