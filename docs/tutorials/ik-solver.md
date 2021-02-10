# IK Solver
Inverse kinematics solver is the implementation of mathematical procedures that calculates the variable joint parameters needed to place the end of a kinematic chain. Very useful for robot manipulation or character's skeleton animation.

## How to use it?
We've hided pretty much all the complexity of the IK... and it works like an [`Operator`](https://docs.zea.live/zea-engine/#/arch-overview?id=operators), you just need to specify the base, the target and the joints, we will do the calculations.

```javascript
const { IKSolver } = window.zeaKinematics 

// Setup the Solver
const ikSolver = new IKSolver('ikSolver')
ikSolver.getInput('Base').setParam(baseItem.getParameter('GlobalXfo'))
ikSolver.getInput('Target').setParam(targetItem.getParameter('GlobalXfo'))
treeItem.addChild(ikSolver)

{
  // Setup Joint 0
  let index = 0
  const addJoint = (name, prevJoint, ori, length, width, height, axis, limits) => {
    const jointMaterial = new Material('chainMaterial', 'SimpleSurfaceShader')
    jointMaterial.getParameter('BaseColor').setValue(new Color(1 - index / 5, 1, 0))

    const joint = new GeomItem(name, new Cuboid(width, height, length, true), jointMaterial)
    const jointXfo = new Xfo()
    jointXfo.tr.set(0, 0, prevJoint.length)
    jointXfo.ori = ori.clone()
    joint.length = length
    joint.getParameter('LocalXfo').setValue(jointXfo)
    prevJoint.addChild(joint, false)

    ikSolver.addJoint(joint.getParameter('GlobalXfo'), axis, limits)
    index++
    return joint
  }

  const ori = new Quat()
  const joint0 = addJoint('joint0', baseItem, ori, 0.3, 0.2, 0.2, 2, [-140, 140])
  ori.setFromAxisAndAngle(new Vec3(0, 1, 0), -0.65)
  const joint1 = addJoint('joint1', joint0, ori, 0.6, 0.15, 0.15, 1, [-60, 80])
  ori.setFromAxisAndAngle(new Vec3(0, 1, 0), -1.2)
  const joint2 = addJoint('joint2', joint1, ori, 0.15, 0.12, 0.12, 1, [0, 150])
  ori.setFromAxisAndAngle(new Vec3(0, 1, 0), 0)
  const joint3 = addJoint('joint3', joint2, ori, 0.3, 0.12, 0.12, 2, [-100, 100])
  ori.setFromAxisAndAngle(new Vec3(0, 1, 0), 0.2)
  const joint4 = addJoint('joint4', joint3, ori, 0.08, 0.11, 0.11, 1, [-90, 90])
  ori.setFromAxisAndAngle(new Vec3(0, 1, 0), 0.0)
  const joint5 = addJoint('joint5', joint4, ori, 0.05, 0.1, 0.1, 2, [-140, 140])
}

ikSolver.enable()
```

## Demo
Checkout our demo code for further understanding.

<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/zea-ik-solver-demo?path=index.html&previewSize=100"
    title="zea-ik-solver-demo on Glitch"
    allow="geolocation; microphone; camera; midi; vr; encrypted-media"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>