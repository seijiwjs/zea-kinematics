import {
  NumberParameter,
  Operator,
  OperatorInput,
  OperatorOutput,
  OperatorOutputMode,
  Registry,
  Vec3,
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

    this.profiles = {
      slow: { rate: 0.5 },
      fast: { rate: 0.9 },
    }

    this.program = [
      { command: 'wait', value: 1 },
      { command: 'moveto', value: 2, profile: 'slow' },
      { command: 'wait', value: 1 },
      { command: 'moveto', value: 0.5, profile: 'fast' },
    ]

    this.simulation = [{ command: 'wait', time: 0 }]
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

/** An operator for aiming items at targets.
 * @extends Operator
 */
class RevoluteJoint extends KinematicPair {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)
    // this.addParameter(new NumberParameter('Time', 0))

    this.addParameter(new NumberParameter('Angle', Math.PI * 0.5))
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const time = this.getInput('Time').getValue() / 1000
    const base = this.getInput('Base').getValue()

    const Angle = this.getParameter('Angle').getValue()
    const maxRate = this.getParameter('Max').getValue()
    const accelRate = this.getParameter('Accel').getValue()
    const decelRate = this.getParameter('Decel').getValue()

    const d = calculateDelta(time, Angle, maxRate, accelRate, decelRate)
    const result = new Xfo()
    result.ori.setFromAxisAndAngle(new Vec3(1, 0, 0), d)
    this.getOutput('Target').setClean(base.multiply(result))
  }
}

Registry.register('RevoluteJoint', RevoluteJoint)

export { PrismaticJoint, RevoluteJoint }
