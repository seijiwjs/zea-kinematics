import { Change, UndoRedoManager } from '@zeainc/zea-ux'

class AddKeyChange extends Change {
  constructor(track, time, value) {
    super(`Add Key to ${track.getName()}`)
    this.track = track
    this.index = track.addKey(time, value)
  }

  update(value) {
    this.track.setKeyValue(this.index, value)
  }

  undo() {
    this.track.removeKey(this.index)
  }

  redo() {
    this.addKey(time, value)
  }
}

export default AddKeyChange
