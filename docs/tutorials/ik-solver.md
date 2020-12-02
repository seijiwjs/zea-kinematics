# IK Solver
Inverse kinematics solver is the implementation of mathematical procedures that calculates the variable joint parameters needed to place the end of a kinematic chain. Very useful for robot manipulation or character's skeleton animation.

## How to use it?
We've hided pretty much all the complexity of the IK... and it works like an [`Operator`](https://docs.zea.live/zea-engine/#/arch-overview?id=operators), you just need to specify the base, the target and the joints, we will do the calculations.

```javascript
const { IKSolver } = window.zeaKinematics 
// or
// import { IKSolver } from '@zeainc/zea-kinematics'

// Specify the base and the target(The one that is going to move the entire chain of joints).
const baseItem = new GeomItem('baseItem', new Cuboid(0.3, 0.3, 0.1, true), material)
const targetItem = new GeomItem('targetItem', new Cuboid(0.05, 0.05, 0.2, true), material)
// Setup the Solver
const ikSolver = new IKSolver('ikSolver')
ikSolver.getInput('Base').setParam(baseItem.getParameter('GlobalXfo'))
ikSolver.getInput('Target').setParam(targetItem.getParameter('GlobalXfo'))
// then you can add as many joints as you want, with the axis it rotates
// and the angle limits it can operate in.
const joint = new GeomItem('Joint0', new Cuboid(0.3, 0.2, 0.2, true), jointMaterial)
const jointXfo = new Xfo()
jointXfo.tr.set(0, 0, 0.1)
jointXfo.ori = ori.clone()
joint.getParameter('LocalXfo').setValue(jointXfo)
baseItem.addChild(joint, false)

ikSolver.addJoint(joint.getParameter('GlobalXfo'), 1, [-90, 90])
```

## Demo
Checkout our demo code for further understanding.

<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/zea-ik-solver-demo?path=index.html&previewSize=0"
    title="zea-ik-solver-demo on Glitch"
    allow="geolocation; microphone; camera; midi; vr; encrypted-media"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>