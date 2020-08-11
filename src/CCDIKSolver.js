import {
  Quat,
  NumberParameter,
  XfoParameter,
  StructParameter,
  Operator,
  OperatorInput,
  OperatorOutput,
  OperatorOutputMode,
  Registry,
  Xfo,
  Vec3,
  MathFunctions
} from '@zeainc/zea-engine'

const X_AXIS = new Vec3(1, 0, 0)
const Y_AXIS = new Vec3(0, 1, 0)
const Z_AXIS = new Vec3(0, 0, 1)
const identityXfo = new Xfo()

class CCDIKJoint {
  constructor(globalXfoParam, axisId = 0) {
    this.axisId = axisId
    this.limits = [0, 0]
    this.align = new Quat()
    // this.output = new OperatorOutput('Joint')
    // this.output.setParam(globalXfoParam)
  }

  init(output, parentXfo) {
    this.output = output
    this.xfo = this.output.getValue().clone() // until we have an IO output
    this.localXfo = parentXfo.inverse().multiply(this.xfo)
  }

  preEval() {
    this.xfo = this.output.getValue().clone() // until we have an IO output
  }

  /**
   * The evaluate method.
   */
  evaluate(parentXfo, tipXfo, targetXfo, isTip) {
    if (isTip) {
      this.xfo.ori = targetXfo.ori
    } else {
      const tipVec = tipXfo.tr.subtract(this.xfo.tr)
      tipVec.normalizeInPlace()
      const targetVec = targetXfo.tr.subtract(this.xfo.tr)
      targetVec.normalizeInPlace()

      this.align.setFrom2Vectors(tipVec, targetVec)
      // align.alignWith(new Quat())

      this.xfo.ori = this.align.multiply(this.xfo.ori)
    }

    ///////////////////////
    // Apply Hinge constraint.

    let axis
    switch (this.axisId) {
      case 0:
        axis = X_AXIS
        // axis = this.xfo.ori.getXaxis()
        break
      case 1:
        axis = Y_AXIS
        // axis = this.xfo.ori.getYaxis()
        break
      case 2:
        axis = Z_AXIS
        // axis = this.xfo.ori.getZaxis()
        break
    }

    this.align.setFrom2Vectors(this.xfo.ori.rotateVec3(axis), parentXfo.ori.rotateVec3(axis))
    this.xfo.ori = this.align.multiply(this.xfo.ori)

    // ///////////////////////
    // // Apply Hinge angle Limits.

    // const currAngle = Math.acos(this.xfo.ori.dot(parentXfo.ori))
    // if (currAngle < this.limits[0] || currAngle > this.limits[1]) {
    //   const newAngle = MathFunctions.clamp(currAngle, this.limits[0], this.limits[1])
    //   switch (this.axisId) {
    //     case 0:
    //       this.align.setFromAxisAndAngle(X_AXIS, newAngle)
    //       break
    //     case 1:
    //       this.align.setFromAxisAndAngle(Y_AXIS, newAngle)
    //       break
    //     case 2:
    //       this.align.setFromAxisAndAngle(Z_AXIS, newAngle)
    //       break
    //   }
    //   this.xfo.ori = parentXfo.ori.multiply(this.align)
    // }
  }

  forwardPropagate(parentXfo, targetXfo, isTip) {
    if (isTip) {
      this.xfo.ori = targetXfo.ori
    }
    this.xfo.tr = parentXfo.ori.rotateVec3(this.localXfo.tr)
  }

  postEval() {
    this.output.setClean(this.xfo)
  }
}

/** An operator for aiming items at targets.
 * @extends Operator
 */
class CCDIKSolver extends Operator {
  /**
   * Create a gears operator.
   * @param {string} name - The name value.
   */
  constructor(name) {
    super(name)

    this.addParameter(new NumberParameter('Iterations', 1))
    // this.addParameter(new NumberParameter('Weight', 1))

    // this.jointsParam = this.addParameter(new ListParameter('Joints', CCDIKJointParameter))
    // this.jointsParam.on('elementAdded', event => {
    //   this.addOutput(event.elem.getOutput(), event.index)
    // })
    // this.jointsParam.on('elementRemoved', event => {
    //   this.removeOutput(event.index)
    // })

    this.addInput(new OperatorInput('Root'))
    this.addInput(new OperatorInput('Target'))
    this.__joints = []
  }

  addJoint(globalXfoParam, axisId = 0) {
    const rootXfo = this.getInput('Root').isConnected() ? this.getInput('Root').getValue() : identityXfo

    // const output = this.addOutput(new OperatorOutput('Joint', OperatorOutputMode.OP_READ_WRITE))
    const joint = new CCDIKJoint(globalXfoParam, axisId)

    const output = this.addOutput(new OperatorOutput('Joint' + this.__joints.length))
    output.setParam(globalXfoParam)

    if (this.__joints.length > 0) {
      const prevJoint = this.__joints[this.__joints.length - 1]
      joint.init(output, prevJoint.xfo)
    } else {
      joint.init(output, rootXfo)
    }

    this.__joints.push(joint)
    return joint
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    const rootXfo = this.getInput('Root').isConnected() ? this.getInput('Root').getValue() : identityXfo
    const targetXfo = this.getInput('Target').getValue()
    const iterations = this.getParameter('Iterations').getValue()
    const numJoints = this.__joints.length
    const tipJoint = this.__joints[numJoints - 1]

    for (let i = 0; i < iterations; i++) {
      for (let j = numJoints - 1; j >= 0; j--) {
        const joint = this.__joints[j]
        const parentXfo = j > 0 ? this.__joints[j - 1].xfo : rootXfo
        joint.evaluate(parentXfo, tipJoint.xfo, targetXfo, j > 0 && j == numJoints - 1)

        // Now re-calculate the chain pose from this point onward.
        for (let k = j + 1; k < numJoints; k++) {
          this.__joints[k].forwardPropagate(this.__joints[k - 1].xfo, targetXfo, k > 0 && k == numJoints - 1)
        }
      }
    }

    // Now store the value to the connected Xfo parameter.
    for (let i = 0; i < numJoints; i++) {
      this.__joints[i].postEval()
    }
  }
}

Registry.register('CCDIKSolver', CCDIKSolver)

export { CCDIKSolver }
