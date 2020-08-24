import { Change, UndoRedoManager } from '@zeainc/zea-ux'

class AddKeyChange extends Change {
  constructor(track, time, value) {
    super(`Add Key to ${track.getName()}`)
    this.track = track
    this.time = time
    this.value = value
    this.index = track.addKey(time, value)
  }

  update(value) {
    this.value = value
    this.track.setKeyValue(this.index, this.value)
  }

  undo() {
    this.track.removeKey(this.index)
  }

  redo() {
    this.track.addKey(this.time, this.value)
  }
}

UndoRedoManager.registerChange('AddKeyChange', AddKeyChange)

export default AddKeyChange
export { AddKeyChange }
