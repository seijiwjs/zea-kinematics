import { Quat, MultiChoiceParameter, Operator, OperatorOutput, OperatorOutputMode, Registry } from '@zeainc/zea-engine'

/** An operator for aiming items at targets.
 * @extends Operator
 */
class RamAndPistonOperator extends Operator {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)

    this.addParameter(
      new MultiChoiceParameter('Axis', 0, ['+X Axis', '-X Axis', '+Y Axis', '-Y Axis', '+Z Axis', '-Z Axis'])
    )

    this.addOutput(new OperatorOutput('Ram', OperatorOutputMode.OP_READ_WRITE))
    this.addOutput(new OperatorOutput('Piston', OperatorOutputMode.OP_READ_WRITE))
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const ramOutput = this.getOutputByIndex(0)
    const pistonOutput = this.getOutputByIndex(1)
    const ramXfo = ramOutput.getValue()
    const pistonXfo = pistonOutput.getValue()

    const axis = this.getParameter('Axis').getValue()
    const dir = pistonXfo.tr.subtract(ramXfo.tr)
    dir.normalizeInPlace()

    const alignRam = new Quat()
    const alignPiston = new Quat()
    let vec
    switch (axis) {
      case 0:
        alignRam.setFrom2Vectors(ramXfo.ori.getXaxis(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getXaxis().negate(), dir)
        break
      case 1:
        alignRam.setFrom2Vectors(ramXfo.ori.getXaxis().negate(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getXaxis(), dir)
        break
      case 2:
        alignRam.setFrom2Vectors(ramXfo.ori.getYaxis(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getYaxis().negate(), dir)
        break
      case 3:
        alignRam.setFrom2Vectors(ramXfo.ori.getYaxis().negate(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getYaxis(), dir)
        break
      case 4:
        alignRam.setFrom2Vectors(ramXfo.ori.getZaxis(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getZaxis().negate(), dir)
        break
      case 5:
        alignRam.setFrom2Vectors(ramXfo.ori.getZaxis().negate(), dir)
        alignPiston.setFrom2Vectors(pistonXfo.ori.getZaxis(), dir)
        break
    }

    ramXfo.ori = alignRam.multiply(ramXfo.ori)
    pistonXfo.ori = alignPiston.multiply(pistonXfo.ori)

    ramOutput.setClean(ramXfo)
    pistonOutput.setClean(pistonXfo)
  }
}

Registry.register('RamAndPistonOperator', RamAndPistonOperator)

export { RamAndPistonOperator }
