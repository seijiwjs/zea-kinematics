import {
  NumberParameter,
  Operator,
  OperatorInput,
  OperatorOutput,
  OperatorOutputMode,
  Registry,
  Xfo,
} from '@zeainc/zea-engine'

const calculateMovementDuration = (totalDistance, maxSpeed, accelRate, decelRate) => {
  return totalDistance / maxSpeed + (maxSpeed / accelRate) * 0.5 + (maxSpeed / decelRate) * 0.5
}
const calculateDelta = (t, totalDistance, maxSpeed, accelRate, decelRate) => {
  if (t < 0) {
    return 0
  }
  const tAccel = maxSpeed / accelRate
  const dAccel = maxSpeed * tAccel * 0.5
  const tDeccel = maxSpeed / decelRate
  const dDeccel = maxSpeed * tDeccel * 0.5
  if (dAccel + dDeccel > totalDistance) {
    const fract = dAccel + dDeccel / totalDistance

    const tAccel = (maxSpeed / accelRate) * fract

    if (t < tAccel) {
      // return (t / tAccel) * dAccel
      return maxSpeed * (t / tAccel) * tAccel * (t / tAccel) * 0.5
    } else {
      const dAccel = maxSpeed * fract * tAccel * 0.5
      const tDeccel = (maxSpeed / decelRate) * fract
      const dDeccel = maxSpeed * fract * tDeccel * 0.5
      // return dAccel + ((t - tAccel) / tDeccel) * dDeccel
      return dAccel + maxSpeed * Math.pow((t - tAccel) / tDeccel, 2) * dDeccel * 0.5
    }
  }
  if (t < tAccel) {
    // console.log('accel:', t, t / tAccel)
    return maxSpeed * Math.pow(t / tAccel, 2) * tAccel * 0.5
  }
  const tMaxSpeed = totalDistance / maxSpeed - tAccel * 0.5 - tDeccel * 0.5
  if (t < tAccel + tMaxSpeed) {
    // console.log('full speed:', dAccel + (t - tAccel))
    return dAccel + (t - tAccel) * maxSpeed
  }
  if (t < tAccel + tMaxSpeed + tDeccel) {
    const dMaxSpeed = tMaxSpeed * maxSpeed
    // console.log('decel:', (t - (tAccel + tMaxSpeed)) / tDeccel)
    const dDecel = maxSpeed * Math.pow((t - (tAccel + tMaxSpeed)) / tDeccel, 2) * tDeccel * 0.5
    return dAccel + dMaxSpeed + dDecel
  }
  return totalDistance
}

// import { Quat, Operator, OperatorInput, OperatorOutput, OperatorOutputMode, Registry } from '@zeainc/zea-engine'

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
