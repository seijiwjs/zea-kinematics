import { Operator, OperatorInput, OperatorOutput, OperatorOutputMode } from '@zeainc/zea-engine'

/** An operator for aiming items at targets.
 * @extends Operator
 */
class TrackSampler extends Operator {
  /**
   * Create a TrackSampler operator.
   * @param {string} name - The name value.
   */
  constructor(name, track) {
    super(name)

    this.track = track

    this.addInput(new OperatorInput('Time'))
    this.addOutput(new OperatorOutput('Output', OperatorOutputMode.OP_WRITE))
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const time = this.getInput('Time').getValue()
    const output = this.getOutputByIndex(0)

    const xfo = this.track.evaluate(time)
    output.setClean(xfo)
  }
}

export { TrackSampler }
