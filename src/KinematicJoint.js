import {
  NumberParameter,
  Operator,
  OperatorInput,
  OperatorOutput,
  OperatorOutputMode,
  Registry,
  Xfo,
} from '@zeainc/zea-engine'

import { calculateMovementDuration, calculateDelta } from './helpers/calculateDelta.js'

/** An operator for aiming items at targets.
 * @extends Operator
 */
class KinematicPair extends Operator {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)
    this.addInput(new OperatorInput('Time'))
    this.addInput(new OperatorInput('Base'))
    this.addOutput(new OperatorOutput('Target', OperatorOutputMode.OP_WRITE))
    this.addParameter(new NumberParameter('Max', 0.5))
    this.addParameter(new NumberParameter('Accel', 1))
    this.addParameter(new NumberParameter('Decel', 1))
  }

  simulate(delta) {
    const Time = this.getParameter('Time').getValue()
    const Max = this.getParameter('Max').getValue()
    const Accel = this.getParameter('Accel').getValue()
    const Decel = this.getParameter('Decel').getValue()

    const duration = calculateMovementDuration(delta, Max, Accel, Decel)
    console.log(Time + duration)
  }
}

/** An operator for aiming items at targets.
 * @extends Operator
 */
class PrismaticJoint extends KinematicPair {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)
    // this.addParameter(new NumberParameter('Time', 0))

    this.addParameter(new NumberParameter('Distance', 2))
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const time = this.getInput('Time').getValue() / 1000
    const base = this.getInput('Base').getValue()

    const Distance = this.getParameter('Distance').getValue()
    const maxRate = this.getParameter('Max').getValue()
    const accelRate = this.getParameter('Accel').getValue()
    const decelRate = this.getParameter('Decel').getValue()

    const d = calculateDelta(time, Distance, maxRate, accelRate, decelRate)
    const result = new Xfo()
    result.tr.x = d
    this.getOutput('Target').setClean(base.multiply(result))
  }
}

Registry.register('PrismaticJoint', PrismaticJoint)

export { PrismaticJoint }
