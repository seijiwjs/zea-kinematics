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

export { calculateDelta, calculateMovementDuration }
