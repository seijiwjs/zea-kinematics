import { Change, UndoRedoManager } from '@zeainc/zea-ux'

class RemoveKeyChange extends Change {
  constructor(track, index) {
    super()
    this.track = track
    this.index = index
    this.time = track.getKeyTime(index)
    this.value = track.getKeyValue(index)
    this.track.removeKey(this.index)
  }

  undo() {
    this.track.addKey(this.time, this.value)
  }

  redo() {
    this.track.removeKey(this.index)
  }
}

UndoRedoManager.registerChange('RemoveKeyChange', RemoveKeyChange)

export default RemoveKeyChange
export { RemoveKeyChange }
