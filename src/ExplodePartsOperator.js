import {
  MathFunctions,
  Vec2,
  Vec3,
  BooleanParameter,
  NumberParameter,
  Vec2Parameter,
  Vec3Parameter,
  ListParameter,
  StructParameter,
  TreeItemParameter,
  Operator,
  OperatorOutput,
  OperatorOutputMode,
  Registry,
} from '@zeainc/zea-engine'

/** Class representing an explode part parameter.
 * @extends StructParameter
 * @private
 */
class ExplodePartParameter extends StructParameter {
  /**
   * Create an explode part parameter.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)

    this.__stageParam = this.addMember(new NumberParameter('Stage', 0))
    this.__axisParam = this.addMember(new Vec3Parameter('Axis', new Vec3(1, 0, 0)))

    // The Movement param enables fine level timing to be set per part.
    this.__movementParam = this.addMember(
      new Vec2Parameter('MovementTiming', new Vec2(0, 1), [new Vec2(0, 0), new Vec2(1, 1)])
    )
    this.__multiplierParam = this.addMember(new NumberParameter('Multiplier', 1.0))
  }

  /**
   * The getStage method.
   * @return {any} - The return value.
   */
  getStage() {
    return this.__stageParam.getValue()
  }

  /**
   * The setStage method.
   * @param {any} stage - The stage value.
   */
  setStage(stage) {
    this.__stageParam.setValue(stage)
  }

  /**
   * The getOutput method.
   * @return {any} - The return value.
   */
  getOutput() {
    return this.__output
  }

  /**
   * The evaluate method.
   * @param {any} explode - The explode value.
   * @param {any} explodeDist - The distance that the parts explode to.
   * @param {any} offset - The offset value.
   * @param {any} stages - The stages value.
   * @param {any} cascade - In "cascade" mode, the parts move in a cascade.
   * @param {any} centered - The centered value.
   * @param {Xfo} parentXfo - The parentXfo value.
   * @param {any} parentDelta - The parentDelta value.
   */
  evaluate(explode, explodeDist, offset, stages, cascade, centered, parentXfo, parentDelta) {
    // Note: during interactive setup of the operator we
    // can have evaluations before anhthing is connected.
    if (!this.__output.isConnected()) return

    const stage = this.__stageParam.getValue()
    const movement = this.__movementParam.getValue()
    let dist
    if (cascade) {
      // In 'cascade' mode, the parts move in a cascade,
      // starting with stage 0. then 1 ...
      let t = stage / stages
      if (centered) t -= 0.5
      dist = explodeDist * MathFunctions.linStep(movement.x, movement.y, Math.max(0, explode - t))
    } else {
      // Else all the parts are spread out across the explode distance.
      let t = 1.0 - stage / stages
      if (centered) t -= 0.5
      dist = explodeDist * MathFunctions.linStep(movement.x, movement.y, explode) * t
    }
    dist += offset

    let explodeDir = this.__axisParam.getValue()
    const multiplier = this.__multiplierParam.getValue()
    let xfo = this.__output.getValue()
    if (parentXfo) {
      xfo = parentDelta.multiply(xfo)
      explodeDir = parentXfo.ori.rotateVec3(explodeDir)
    }
    xfo.tr.addInPlace(explodeDir.scale(dist * multiplier))
    this.__output.setClean(xfo)
  }

  // ////////////////////////////////////////
  // Persistence

  /**
   * The toJSON method encodes this type as a json object for persistence.
   * @param {object} context - The context value.
   * @return {object} - Returns the json object.
   */
  toJSON(context) {
    const j = super.toJSON(context)
    if (j) {
      j.output = this.__output.toJSON(context)
    }
    return j
  }

  /**
   * The fromJSON method decodes a json object for this type.
   * @param {object} j - The json object this item must decode.
   * @param {object} context - The context value.
   */
  fromJSON(j, context) {
    super.fromJSON(j, context)
    if (j.output) {
      this.__output.fromJSON(j.output, context)
    }
  }
}

/** Class representing an explode parts operator.
 * @extends ParameterOwner
 */
class ExplodePartsOperator extends Operator {
  /**
   * Create an explode parts operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)

    this.__stagesParam = this.addParameter(new NumberParameter('Stages', 0))
    this._explodeParam = this.addParameter(new NumberParameter('Explode', 0.0, [0, 1]))
    this._distParam = this.addParameter(new NumberParameter('Dist', 1.0))
    this._offsetParam = this.addParameter(new NumberParameter('Offset', 0))
    this._cascadeParam = this.addParameter(new BooleanParameter('Cascade', false))
    this._centeredParam = this.addParameter(new BooleanParameter('Centered', false))
    this.__parentItemParam = this.addParameter(new TreeItemParameter('RelativeTo'))
    this.__parentItemParam.on('valueChanged', () => {
      // compute the local xfos
      const parentItem = this.__parentItemParam.getValue()
      if (parentItem) this.__invParentSpace = parentItem.getParameter('GlobalXfo').getValue().inverse()
      else this.__invParentSpace = undefined
    })
    this.__parentItemParam.on('treeItemGlobalXfoChanged', () => {
      this.setDirty()
    })

    this.__itemsParam = this.addParameter(new ListParameter('Parts', ExplodePartParameter))
    this.__itemsParam.on('elementAdded', (event) => {
      if (event.index > 0) {
        const prevStage = this.__itemsParam.getElement(event.index - 1).getStage()
        event.elem.setStage(prevStage + 1)
        this.__stagesParam.setValue(prevStage + 2)
      } else {
        this.__stagesParam.setValue(1)
      }
      event.elem.__output = new OperatorOutput('Part' + event.index, OperatorOutputMode.OP_READ_WRITE)
      this.addOutput(event.elem.getOutput())
      this.setDirty()
    })
    this.__itemsParam.on('elementRemoved', (event) => {
      this.removeOutput(event.elem.getOutput())
    })
    this.addParameter(this.__itemsParam)

    this.__localXfos = []
    this.__parts = []
    this.__stages = 2
  }

  addPart() {
    const part = new ExplodePartParameter()
    this.__itemsParam.addElement(part)
    return part
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    // console.log(`Operator: evaluate: ${this.getName()}`)
    const stages = this.__stagesParam.getValue()
    const explode = this._explodeParam.getValue()
    // const explodeDir = this.getParameter('Axis').getValue();
    const explodeDist = this._distParam.getValue()
    const offset = this._offsetParam.getValue()
    const cascade = this._cascadeParam.getValue()
    const centered = this._centeredParam.getValue()
    const parentItem = this.__parentItemParam.getValue()
    let parentXfo
    let parentDelta
    if (parentItem) {
      parentXfo = parentItem.getParameter('GlobalXfo').getValue()
      parentDelta = this.__invParentSpace.multiply(parentXfo)
    }

    const items = this.__itemsParam.getValue()
    for (let i = 0; i < items.length; i++) {
      const part = items[i]
      part.evaluate(explode, explodeDist, offset, stages, cascade, centered, parentXfo, parentDelta)
    }
  }

  // ////////////////////////////////////////
  // Persistence

  /**
   * The toJSON method encodes this type as a json object for persistence.
   *
   * @param {object} context - The context value.
   * @return {object} - Returns the json object.
   */
  toJSON(context) {
    return super.toJSON(context)
  }

  /**
   * The fromJSON method decodes a json object for this type.
   * @param {object} j - The json object this item must decode.
   * @param {object} context - The context value.
   */
  fromJSON(j, context) {
    super.fromJSON(j, context)
  }
}

Registry.register('ExplodePartsOperator', ExplodePartsOperator)

export { ExplodePartsOperator }
