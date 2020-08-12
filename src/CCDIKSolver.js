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
    this.limits = [-Math.PI, Math.PI]
    this.align = new Quat()
    // this.output = new OperatorOutput('Joint')
    // this.output.setParam(globalXfoParam)
  }

  init(output, globalXfoParam, parentXfo) {
    this.output = output
    this.output.setParam(globalXfoParam)
    this.xfo = this.output.getValue().clone() // until we have an IO output
    this.bindLocalXfo = parentXfo.inverse().multiply(this.xfo)
    this.localXfo = this.bindLocalXfo.clone()
  }

  preEval(parentXfo) {
    // this.xfo = this.output.getValue().clone() // until we have an IO output
    this.xfo.ori = parentXfo.ori.multiply(this.bindLocalXfo.ori)
    this.xfo.tr = parentXfo.tr.add(parentXfo.ori.rotateVec3(this.bindLocalXfo.tr))
    // this.localXfo = parentXfo.inverse().multiply(this.xfo)
  }

  /**
   * The evaluate method.
   */
  evaluate(parentXfo, tipXfo, targetXfo, isTip) {
    if (isTip) {
      this.xfo.ori = targetXfo.ori

      // const tipVec = this.xfo.ori.getZaxis()
      // const targetVec = targetXfo.ori.getZaxis()
      // this.align.setFrom2Vectors(tipVec, targetVec)
      // this.xfo.ori = this.align.multiply(this.xfo.ori)
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
        break
      case 1:
        axis = Y_AXIS
        break
      case 2:
        axis = Z_AXIS
        break
    }

    const globalAxis = parentXfo.ori.rotateVec3(axis)

    this.align.setFrom2Vectors(this.xfo.ori.rotateVec3(axis), globalAxis)
    this.xfo.ori = this.align.multiply(this.xfo.ori)

    this.align.setFrom2Vectors(this.localXfo.ori.rotateVec3(axis), axis)
    this.localXfo.ori = this.align.multiply(this.localXfo.ori)

    ///////////////////////
    // Apply angle Limits.

    const currAngle = Math.acos(this.xfo.ori.dot(parentXfo.ori))
    if (currAngle < this.limits[0] || currAngle > this.limits[1]) {
      const deltaAngle = currAngle < this.limits[0] ? this.limits[0] - currAngle : currAngle - this.limits[1]
      this.align.setFromAxisAndAngle(globalAxis, deltaAngle)
      this.xfo.ori = this.align.multiply(this.xfo.ori)
    }

    this.localXfo.ori = parentXfo.ori.inverse().multiply(this.xfo.ori)
    this.localXfo.ori.normalizeInPlace()
  }

  forwardPropagate(parentXfo, targetXfo, isTip) {
    // if (isTip) {
    //   this.xfo.ori = targetXfo.ori
    // }
    // this.xfo.tr = parentXfo.ori.rotateVec3(this.localXfo.tr)

    // this.xfo = parentXfo.multiply(this.localXfo)

    this.xfo.ori = parentXfo.ori.multiply(this.localXfo.ori)
    this.xfo.tr = parentXfo.tr.add(parentXfo.ori.rotateVec3(this.localXfo.tr))
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
    this.enabled = false
  }

  addJoint(globalXfoParam, axisId = 0) {
    const rootXfo = this.getInput('Root').isConnected() ? this.getInput('Root').getValue() : identityXfo

    // const output = this.addOutput(new OperatorOutput('Joint', OperatorOutputMode.OP_READ_WRITE))
    const joint = new CCDIKJoint(globalXfoParam, axisId)

    const output = this.addOutput(new OperatorOutput('Joint' + this.__joints.length))

    if (this.__joints.length > 0) {
      const prevJoint = this.__joints[this.__joints.length - 1]
      joint.init(output, globalXfoParam, prevJoint.xfo)
    } else {
      joint.init(output, globalXfoParam, rootXfo)
    }

    this.__joints.push(joint)
    return joint
  }

  enable() {
    this.enabled = true
    this.setDirty()
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    if (!this.enabled) {
      this.__joints.forEach(joints => joints.postEval())
      return
    }
    const rootXfo = this.getInput('Root').isConnected() ? this.getInput('Root').getValue() : identityXfo
    const targetXfo = this.getInput('Target').getValue()
    const iterations = 20 //this.getParameter('Iterations').getValue()
    const numJoints = this.__joints.length
    const tipJoint = this.__joints[numJoints - 1]

    for (let i = 0; i < numJoints; i++) {
      const parentXfo = i > 0 ? this.__joints[i - 1].xfo : rootXfo
      this.__joints[i].preEval(parentXfo)
    }

    for (let i = 0; i < iterations; i++) {
      for (let j = numJoints - 1; j >= numJoints - 4; j--) {
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
