import {
  Color,
  GeomItem,
  Lines,
  Cuboid,
  Points,
  Material,
  Operator,
  OperatorOutput,
  OperatorOutputMode,
} from '@zeainc/zea-engine'
import { BaseTrack } from './BaseTrack'

/** An operator for aiming items at targets.
 * @extends Operator
 */
class KeyDisplayOperator extends Operator {
  /**
   * Create a gears operator.
   * @param {BaseTrack} track - The track value.
   * @param {number} keyIndex - The index of the key in the track
   */
  constructor(track, keyIndex) {
    super(name)

    this.addOutput(new OperatorOutput('KeyLocal', OperatorOutputMode.OP_WRITE))

    this.track = track
    this.keyIndex = keyIndex
    this.track.on('keyChanged', (event) => {
      if (event.index == this.keyIndex) this.setDirty()
    })
    this.track.on('keyRemoved', (event) => {
      const { index } = event
      if (this.keyIndex >= index) {
        this.setDirty()
      }
    })
    this.track.on('keyAdded', (event) => {
      const { index } = event
      if (this.keyIndex >= index) {
        this.setDirty()
      }
    })
  }

  backPropagateValue(value) {
    this.track.setKeyValue(this.keyIndex, value)
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    this.getOutputByIndex(0).setClean(this.track.getKeyValue(this.keyIndex))
  }
}

/** An operator for aiming items at targets.
 * @extends Operator
 */
class XfoTrackDisplay extends GeomItem {
  /**
   * Create a TrackDisplay operator.
   * @param {string} name - The name value.
   * @param {BaseTrack} track - The track to display.
   */
  constructor(track) {
    super(track.getName())

    this.track = track

    this.getParameter('Geometry').setValue(new Lines())

    const linesMat = new Material('trackLine', 'LinesShader')
    linesMat.getParameter('BaseColor').setValue(new Color(0.3, 0.3, 0.3))
    linesMat.getParameter('Overlay').setValue(0.5)
    this.getParameter('Material').setValue(linesMat)

    const dotsMat = new Material('trackDots', 'PointsShader')
    dotsMat.getParameter('BaseColor').setValue(new Color(0.75, 0.75, 0.75))
    dotsMat.getParameter('Overlay').setValue(0.5)
    this.dotsItem = new GeomItem('dots', new Points(), dotsMat)
    this.addChild(this.dotsItem)

    this.__keyMat = new Material('trackLine', 'HandleShader')
    this.__keyMat.getParameter('MaintainScreenSize').setValue(1)
    this.__keyMat.getParameter('Overlay').setValue(0.5)
    this.__keyCube = new Cuboid(0.004, 0.004, 0.004)

    this.__keys = []
    this.updatePath()
    this.displayKeys()

    this.track.on('keyAdded', (event) => {
      this.displayKeys()
      this.updatePath()
    })
    this.track.on('keyRemoved', (event) => {
      const { index } = event
      const handle = this.__keys.pop()
      this.removeChild(this.getChildIndex(handle))
      this.displayKeys()
      this.updatePath()
    })
    this.track.on('keyChanged', (event) => {
      this.updatePath()
    })
    this.track.on('loaded', (event) => {
      this.updatePath()
      this.displayKeys()
    })
  }

  displayKeys() {
    const displayKey = (index) => {
      if (!this.__keys[index]) {
        const handle = new GeomItem('key' + index, this.__keyCube, this.__keyMat)
        this.addChild(handle)
        const keyDisplay = new KeyDisplayOperator(this.track, index)
        keyDisplay.getOutput('KeyLocal').setParam(handle.getParameter('LocalXfo'))
        this.__keys.push(handle)
      }
    }

    const numKeys = this.track.getNumKeys()
    for (let i = 0; i < numKeys; i++) {
      displayKey(i)
    }
  }

  updatePath(timeRange) {
    const trackLines = this.getParameter('Geometry').getValue()
    const trackDots = this.dotsItem.getParameter('Geometry').getValue()

    const trackTimeRange = this.track.getTimeRange()
    if (Number.isNaN(trackTimeRange.x) || Number.isNaN(trackTimeRange.y)) return

    const numSamples = Math.round((trackTimeRange.y - trackTimeRange.x) / 50) // Display at 50 samples per second
    if (numSamples == 0) return

    trackLines.setNumVertices(numSamples + 1)
    trackLines.setNumSegments(numSamples)

    trackDots.setNumVertices(numSamples + 1)
    const linePositions = trackLines.getVertexAttribute('positions')
    const dotPositions = trackDots.getVertexAttribute('positions')
    for (let i = 0; i <= numSamples; i++) {
      if (i < numSamples) trackLines.setSegmentVertexIndices(i, i, i + 1)
      const time = trackTimeRange.x + (trackTimeRange.y - trackTimeRange.x) * (i / numSamples)
      const xfo = this.track.evaluate(time)
      linePositions.getValueRef(i).setFromOther(xfo.tr)
      dotPositions.getValueRef(i).setFromOther(xfo.tr)
    }

    trackDots.setBoundingBoxDirty()
    trackDots.emit('geomDataTopologyChanged', {})

    trackLines.setBoundingBoxDirty()
    trackLines.emit('geomDataTopologyChanged', {})
  }
}

export { XfoTrackDisplay }
