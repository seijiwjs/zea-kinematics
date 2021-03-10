import {
  Quat,
  NumberParameter,
  Operator,
  OperatorInput,
  OperatorOutput,
  Registry,
  Xfo,
  Vec3,
  Material,
  GeomItem,
  TreeItem,
  Lines,
  Color,
  MathFunctions,
} from '@zeainc/zea-engine'

const X_AXIS = new Vec3(1, 0, 0)
const Y_AXIS = new Vec3(0, 1, 0)
const Z_AXIS = new Vec3(0, 0, 1)
const identityXfo = new Xfo()
const identityQuat = new Quat()

const generateDebugLines = (debugTree, color) => {
  const line = new Lines()
  const linepositions = line.getVertexAttribute('positions')

  const mat = new Material('debug', 'LinesShader')
  mat.getParameter('BaseColor').setValue(new Color(color))
  mat.getParameter('Overlay').setValue(1)

  const debugGeomItem = new GeomItem('Pointer', line, mat)
  debugTree.addChild(debugGeomItem)

  let numDebugSegments = 0
  let numDebugPoints = 0

  return {
    addDebugSegment: (p0, p1) => {
      const pid0 = numDebugPoints
      const pid1 = numDebugPoints + 1
      numDebugSegments++
      numDebugPoints += 2
      if (line.getNumVertices() < numDebugPoints) line.setNumVertices(numDebugPoints)
      if (line.getNumSegments() < numDebugSegments) line.setNumSegments(numDebugSegments)
      line.setSegmentVertexIndices(numDebugSegments - 1, pid0, pid1)
      linepositions.getValueRef(pid0).setFromOther(p0)
      linepositions.getValueRef(pid1).setFromOther(p1)
    },
    doneFrame: () => {
      line.emit('geomDataTopologyChanged')
      numDebugSegments = 0
      numDebugPoints = 0
    },
  }
}

class IKJoint {
  constructor(index, axisId = 0, limits, solverDebugTree) {
    this.index = index
    this.axisId = axisId
    this.limits = [MathFunctions.degToRad(limits[0]), MathFunctions.degToRad(limits[1])]
    this.backPropagationWeight = 0.0
    this.align = new Quat()

    this.debugTree = new TreeItem('IKJoint' + index)
    solverDebugTree.addChild(this.debugTree)
    this.debugLines = {}
  }

  addDebugSegment(color, p0, p1) {
    if (!this.debugLines[color]) {
      this.debugLines[color] = generateDebugLines(this.debugTree, color)
    }
    this.debugLines[color].addDebugSegment(p0, p1)
  }

  init(parentXfo, index, numJoints) {
    this.xfo = this.output.getValue().clone() // until we have an IO output
    this.localXfo = parentXfo.inverse().multiply(this.xfo)
    this.bindLocalXfo = this.localXfo.clone()

    this.backPropagationWeight = index / (numJoints - 1)

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

  backPropagateOrientation(baseXfo, targetXfo, index, joints) {
    if (index == joints.length - 1) {
      this.xfo.ori = targetXfo.ori.clone()
    }

    ///////////////////////
    // Apply joint constraint.
    // const backPropagationWeight = Math.max(0, index / (joints.length - 1) - 0.5)
    if (this.backPropagationWeight > 0) {
      const parentJoint = joints[index - 1]
      const globalAxis = this.xfo.ori.rotateVec3(this.axis)
      const parentGlobalAxis = (index > 0 ? parentJoint.xfo : baseXfo).ori.rotateVec3(this.axis)
      // this.addDebugSegment('#FF0000', this.xfo.tr, this.xfo.tr.add(globalAxis.scale(-0.2)))
      // this.addDebugSegment('#FFFF00', this.xfo.tr, this.xfo.tr.add(parentGlobalAxis.scale(-0.2)))

      this.align.setFrom2Vectors(globalAxis, parentGlobalAxis)
      if (this.backPropagationWeight == 1.0) {
        parentJoint.xfo.ori = this.align.conjugate().multiply(parentJoint.xfo.ori)
        parentJoint.xfo.ori.normalizeInPlace()
      } else {
        // We propagate the alignment up the chain by rotating our parent.
        const parentAlign = this.align.lerp(identityQuat, this.backPropagationWeight).conjugate()
        parentJoint.xfo.ori = parentAlign.multiply(parentJoint.xfo.ori)
        this.xfo.ori = this.align.lerp(identityQuat, 1 - this.backPropagationWeight).multiply(this.xfo.ori)
      }
    } else {
      const globalAxis = this.xfo.ori.rotateVec3(this.axis)
      const parentGlobalAxis = (index > 0 ? joints[index - 1].xfo : baseXfo).ori.rotateVec3(this.axis)
      this.align.setFrom2Vectors(globalAxis, parentGlobalAxis)
      this.xfo.ori = this.align.multiply(this.xfo.ori)
    }
  }

  forwardPropagateAlignment(baseXfo, targetXfo, index, joints) {
    ///////////////////////
    // Aim sub-chain at target
    {
      const targetVec = targetXfo.tr.subtract(this.xfo.tr)
      const jointToTip = joints[joints.length - 1].xfo.tr.subtract(this.xfo.tr)

      if (jointToTip.length() > 0.0001 && targetVec.length() > 0.0001) {
        jointToTip.normalizeInPlace()
        targetVec.normalizeInPlace()
        this.align.setFrom2Vectors(jointToTip, targetVec)
        this.xfo.ori = this.align.multiply(this.xfo.ori)
        // this.addDebugSegment('#FF0000', this.xfo.tr, this.xfo.tr.add(jointToTip))
        // this.addDebugSegment('#FFFF00', this.xfo.tr, this.xfo.tr.add(targetVec))
      }
    }
    this.xfo.ori.normalizeInPlace()

    ///////////////////////
    // Apply joint constraint.
    {
      const globalAxis = this.xfo.ori.rotateVec3(this.axis)
      const parentGlobalAxis = (index > 0 ? joints[index - 1].xfo : baseXfo).ori.rotateVec3(this.axis)
      this.align.setFrom2Vectors(globalAxis, parentGlobalAxis)
      this.xfo.ori = this.align.multiply(this.xfo.ori)
    }

    ///////////////////////
    // Apply angle Limits.
    {
      const parentXfo = index > 0 ? joints[index - 1].xfo : baseXfo
      const deltaQuat = parentXfo.ori.inverse().multiply(this.xfo.ori)

      let currAngle = deltaQuat.w < 1.0 ? deltaQuat.getAngle() : 0.0

      const deltaAxis = new Vec3(deltaQuat.x, deltaQuat.y, deltaQuat.x)
      if (this.axis.dot(deltaAxis) > 0.0) currAngle = -currAngle

      if (currAngle < this.limits[0] || currAngle > this.limits[1]) {
        const deltaAngle = currAngle < this.limits[0] ? this.limits[0] - currAngle : this.limits[1] - currAngle
        this.align.setFromAxisAndAngle(this.axis, -deltaAngle)
        this.xfo.ori = this.xfo.ori.multiply(this.align)
      }
    }

    {
      let parentXfo = this.xfo
      for (let i = index + 1; i < joints.length; i++) {
        const joint = joints[i]
        joint.xfo.ori = parentXfo.ori.multiply(joint.localXfo.ori)
        joint.xfo.tr = parentXfo.transformVec3(joint.localXfo.tr)
        parentXfo = joint.xfo
      }
    }
  }

  setClean() {
    for (let key in this.debugLines) this.debugLines[key].doneFrame()
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

    this.addParameter(new NumberParameter('Iterations', 5))
    this.addInput(new OperatorInput('Base'))
    this.addInput(new OperatorInput('Target'))
    this.joints = []
    this.enabled = false

    this.debugTree = new TreeItem('IKSolver-debug')
  }

  addJoint(globalXfoParam, axisId = 0, limits = [-180, 180]) {
    const joint = new IKJoint(this.joints.length, axisId, limits, this.debugTree)

    const output = this.addOutput(new OperatorOutput('Joint' + this.joints.length))
    output.setParam(globalXfoParam)
    joint.output = output

    this.joints.push(joint)
    return joint
  }

  enable() {
    const baseXfo = this.getInput('Base').isConnected() ? this.getInput('Base').getValue() : identityXfo
    this.joints.forEach((joint, index) => {
      const parentXfo = index > 0 ? this.joints[index - 1].xfo : baseXfo
      joint.init(parentXfo, index, this.joints.length)
    })
    this.enabled = true
    this.setDirty()
  }

  /**
   * The evaluate method.
   */
  evaluate() {
    if (!this.enabled) {
      return
    }
    const targetXfo = this.getInput('Target').getValue()
    const baseXfo = this.getInput('Base').isConnected() ? this.getInput('Base').getValue() : identityXfo

    const iterations = this.getParameter('Iterations').getValue()
    const numJoints = this.joints.length

    for (let i = 0; i < iterations; i++) {
      for (let j = numJoints - 1; j >= 0; j--) {
        const joint = this.joints[j]
        joint.backPropagateOrientation(baseXfo, targetXfo, j, this.joints)
      }

      {
        let parentXfo = this.joints[0].xfo
        for (let i = 1; i < this.joints.length; i++) {
          const joint = this.joints[i]
          joint.localXfo.ori = parentXfo.ori.inverse().multiply(joint.xfo.ori)
          joint.xfo.ori = parentXfo.ori.multiply(joint.localXfo.ori)
          joint.xfo.tr = parentXfo.transformVec3(joint.localXfo.tr)
          parentXfo = joint.xfo
        }
      }
      {
        for (let j = 0; j < this.joints.length; j++) {
          const joint = this.joints[j]
          joint.forwardPropagateAlignment(baseXfo, targetXfo, j, this.joints)
        }
      }
    }

    // Now store the value to the connected Xfo parameter.
    for (let i = 0; i < numJoints; i++) {
      this.joints[i].setClean()
    }
  }
}

Registry.register('IKSolver', IKSolver)

export { IKSolver }
