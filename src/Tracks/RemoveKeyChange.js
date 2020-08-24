import { Change, UndoRedoManager } from '@zeainc/zea-ux'

class RemoveKeyChange extends Change {
  constructor(track, index) {
    super()
    this.track = track
    this.index = index
  }

  undo() {}

  redo() {}
}
