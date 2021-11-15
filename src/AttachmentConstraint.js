import { Xfo, Operator, OperatorInput, OperatorOutput, OperatorOutputMode, Registry } from '@zeainc/zea-engine'

/** An operator for aiming items at targets.
 * @extends Operator
 */
class AttachmentConstraint extends Operator {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)

    console.log('AttachmentConstraint')

    this.addInput(new OperatorInput('Time'))
    this.addOutput(new OperatorOutput('Attached', OperatorOutputMode.OP_READ_WRITE))

    this.__attachTargets = []
    this.__attachId = -1
  }

  addAttachTarget(target, time) {
    const input = this.addInput(new OperatorInput('Target' + this.getNumInputs()))
    input.setParam(target)

    this.__attachTargets.push({
      input,
      time,
      offsetXfo: undefined,
    })
  }

  getAttachTarget(attachId) {
    return this.getInputByIndex(attachId + 1)
  }

  findTarget(time) {
    if (this.__attachTargets.length == 0 || time <= this.__attachTargets[0].time) {
      return -1
    }
    const numKeys = this.__attachTargets.length
    if (time >= this.__attachTargets[numKeys - 1].time) {
      return numKeys - 1
    }
    // Find the first key after the specified time value
    for (let i = 1; i < numKeys; i++) {
      const key = this.__attachTargets[i]
      if (key.time > time) {
        return i - 1
      }
    }
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const time = this.getInput('Time').getValue()
    const output = this.getOutputByIndex(0)
    let xfo = output.getValue()

    const attachId = this.findTarget(time)
    if (attachId != -1) {
      const currXfo = this.getAttachTarget(attachId).getValue()
      const attachment = this.__attachTargets[attachId]

      if (attachId != this.__attachId) {
        if (!attachment.offsetXfo) {
          if (this.__attachId == -1) {
            attachment.offsetXfo = currXfo.inverse().multiply(xfo)
          } else {
            const prevXfo = this.getAttachTarget(this.__attachId).getValue()
            const prevOffset = this.__attachTargets[this.__attachId].offsetXfo
            const offsetXfo = currXfo.inverse().multiply(prevXfo.multiply(prevOffset))
            attachment.offsetXfo = offsetXfo
          }
        }
        this.__attachId = attachId
      }

      xfo = currXfo.multiply(attachment.offsetXfo)
    }

    output.setClean(xfo)
  }
}

Registry.register('AttachmentConstraint', AttachmentConstraint)

export { AttachmentConstraint }
