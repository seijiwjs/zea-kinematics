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

class IKJoint {
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
    this.forwardLocalTr = this.localXfo.tr
    this.backwardsLocalTr = this.localXfo.tr.negate()

    this.tipVec = new Vec3()

    switch (this.axisId) {
      case 0:
        this.axis = X_AXIS
        break
      case 1:
        this.axis = Y_AXIS
        break
      case 2:
        this.axis = Z_AXIS
        break
    }
  }

  preEval(parentXfo) {
    // this.xfo = this.output.getValue().clone() // until we have an IO output
    // this.xfo.ori = parentXfo.ori.multiply(this.bindLocalXfo.ori)
    // this.xfo.tr = parentXfo.tr.add(parentXfo.ori.rotateVec3(this.bindLocalXfo.tr))
  }

  evalBackwards(childJoint, isTip, targetXfo, rootXfo, vecBaseToJoint) {
    if (isTip) {
      this.xfo = targetXfo.clone()
    } else {
      const jointVec = this.xfo.ori.rotateVec3(childJoint.forwardLocalTr)

      const targetVec = childJoint.xfo.tr.subtract(rootXfo.tr)
      this.align.setFrom2Vectors(vecBaseToJoint, targetVec)
      this.xfo.ori = this.align.multiply(this.xfo.ori)

      vecBaseToJoint.subtractInPlace(jointVec)

      ///////////////////////
      // Apply Hinge constraint.
      this.align.setFrom2Vectors(
        this.xfo.ori.rotateVec3(childJoint.axis),
        childJoint.xfo.ori.rotateVec3(childJoint.axis)
      )
      this.xfo.ori = this.align.multiply(this.xfo.ori)

      ///////////////////////
      // Apply angle Limits.

      // const currAngle = Math.acos(this.xfo.ori.dot(parentXfo.ori))
      // if (currAngle < childJoint.limits[0] || currAngle > childJoint.limits[1]) {
      //   const deltaAngle =
      //     currAngle < childJoint.limits[0] ? childJoint.limits[0] - currAngle : currAngle - childJoint.limits[1]
      //   this.align.setFromAxisAndAngle(globalAxis, deltaAngle)
      //   this.xfo.ori = this.align.multiply(this.xfo.ori)
      // }

      this.xfo.tr = childJoint.xfo.tr.subtract(this.xfo.ori.rotateVec3(childJoint.forwardLocalTr))
    }
  }

  evalForwards(parentJoint, childJoint, isBase, isTip, rootXfo, targetXfo, vecBaseToJoint) {
    if (isBase) {
      this.xfo.tr = rootXfo.tr.add(rootXfo.ori.rotateVec3(this.forwardLocalTr))
    } else {
      this.xfo.tr = parentJoint.xfo.tr.add(parentJoint.xfo.ori.rotateVec3(this.forwardLocalTr))
    }
    if (isTip) {
      this.xfo.ori = targetXfo.ori
    } else {
      const jointVec = this.xfo.ori.rotateVec3(childJoint.forwardLocalTr)

      const targetVec = targetXfo.tr.subtract(this.xfo.tr)
      this.align.setFrom2Vectors(vecBaseToJoint, targetVec)
      this.xfo.ori = this.align.multiply(this.xfo.ori)

      vecBaseToJoint.subtractInPlace(jointVec)
    }

    ///////////////////////
    // Apply Hinge constraint.
    if (isBase) {
      this.align.setFrom2Vectors(this.xfo.ori.rotateVec3(this.axis), rootXfo.ori.rotateVec3(this.axis))
    } else {
      this.align.setFrom2Vectors(this.xfo.ori.rotateVec3(this.axis), parentJoint.xfo.ori.rotateVec3(this.axis))
    }
    this.xfo.ori = this.align.multiply(this.xfo.ori)
  }

  setClean() {
    this.output.setClean(this.xfo)
  }
}

/** An operator for aiming items at targets.
 * @extends Operator
 */
class IKSolver extends Operator {
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
    const joint = new IKJoint(globalXfoParam, axisId)

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
      this.__joints.forEach(joints => joints.setClean())
      return
    }
    const rootXfo = this.getInput('Root').isConnected() ? this.getInput('Root').getValue() : identityXfo
    const targetXfo = this.getInput('Target').getValue()
    const iterations = 10 //this.getParameter('Iterations').getValue()
    const numJoints = this.__joints.length
    const tipJoint = this.__joints[numJoints - 1]

    for (let i = 0; i < numJoints; i++) {
      const parentXfo = i > 0 ? this.__joints[i - 1].xfo : rootXfo
      this.__joints[i].preEval(parentXfo)
    }

    for (let i = 0; i < iterations; i++) {
      {
        const vecBaseToJoint = tipJoint.xfo.tr.subtract(rootXfo.tr)
        for (let j = numJoints - 1; j >= 0; j--) {
          const joint = this.__joints[j]
          const childJoint = this.__joints[Math.min(j + 1, numJoints - 1)]
          const isTip = j > 0 && j == numJoints - 1
          joint.evalBackwards(childJoint, isTip, targetXfo, rootXfo, vecBaseToJoint)
        }
      }
      {
        const vecBaseToJoint = tipJoint.xfo.tr.subtract(rootXfo.tr)
        for (let j = 0; j < numJoints; j++) {
          const joint = this.__joints[j]
          const parentJoint = this.__joints[Math.max(j - 1, 0)]
          const childJoint = this.__joints[Math.min(j + 1, numJoints - 1)]
          const isBase = j == 0
          const isTip = j > 0 && j == numJoints - 1
          joint.evalForwards(parentJoint, childJoint, isBase, isTip, rootXfo, targetXfo, vecBaseToJoint)
        }
      }
    }

    // Now store the value to the connected Xfo parameter.
    for (let i = 0; i < numJoints; i++) {
      this.__joints[i].setClean()
    }
  }
}

Registry.register('IKSolver', IKSolver)

export { IKSolver }
