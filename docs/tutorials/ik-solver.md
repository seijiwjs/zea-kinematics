# IK Solver
Inverse kinematics solver is the implementation of mathematical procedures that calculates the variable joint parameters needed to place the end of a kinematic chain. Very useful for robot manipulation or character's skeleton animation.

## How to use it?
We've hided pretty much all the complexity of the IK... and it works like an [`Operator`](https://docs.zea.live/zea-engine/#/arch-overview?id=operators), you just need to specify the base, the target and the joints, we will do the calculations.

```javascript
const { IKSolver } = window.zeaKinematics 

const scene = new Scene()
const renderer = new GLRenderer(domElement, { hideSplash: true })

const treeItem = new TreeItem('TreeItem')
scene.getRoot().addChild(treeItem)

{
  scene.setupGrid(10000, 10)
  const color = new Color('#E5E5E5')
  renderer.getViewport().backgroundColorParam.value = color
  renderer.setScene(scene)
  renderer.getViewport().getCamera().setPositionAndTarget(new Vec3(-3000, 3000, 1000), new Vec3(0, 0, 0))
}

const targetMaterial = new Material('targetMaterial', 'SimpleSurfaceShader')
{
  targetMaterial.getParameter('BaseColor').setValue(new Color(1, 0, 0))
}

const chainMaterial = new Material('chainMaterial', 'SimpleSurfaceShader')
chainMaterial.getParameter('BaseColor').setValue(new Color(0, 1, 0))
const baseItem = new GeomItem('baseItem', new Cuboid(0.3, 0.3, 0.1, true), chainMaterial)
baseItem.length = 0.1

const targetItem = new GeomItem('targetItem', new Cuboid(0.05, 0.05, 0.2, true), targetMaterial)
const targetXfo = new Xfo()
const xfoHandleXfo = targetXfo.clone()

const xfoHandle = new XfoHandle()
xfoHandle.setVisible(false)
xfoHandle.getParameter('HighlightColor').setValue(new Color(1, 1, 0))
{
  treeItem.addChild(baseItem)

  targetXfo.tr.set(-1, 0, 0.5)
  targetXfo.ori.setFromAxisAndAngle(new Vec3(0, 1, 0), Math.PI * -0.5)
  targetItem.getParameter('LocalXfo').setValue(targetXfo)
  treeItem.addChild(targetItem)

  xfoHandleXfo.tr.set(-1.1, 0, 0.5)
  xfoHandleXfo.sc.set(0.5, 0.5, 0.5)
  xfoHandle.getParameter('GlobalXfo').setValue(xfoHandleXfo)
  targetItem.addChild(xfoHandle)
  xfoHandle.setTargetParam(targetItem.getParameter('GlobalXfo'))
}

// Setup the Solver
const ikSolver = new IKSolver('ikSolver')
ikSolver.getInput('Base').setParam(baseItem.getParameter('GlobalXfo'))
ikSolver.getInput('Target').setParam(targetItem.getParameter('GlobalXfo'))
// treeItem.addChild(ikSolver)

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

const rootXfo = new Xfo()
rootXfo.sc.set(1000, 1000, 1000)
treeItem.getParameter('LocalXfo').setValue(rootXfo)

ikSolver.enable()

{
  // Make the target draggable.
  let draggedGeom
  let offset
  const geomRay = new Ray()
  const pointerMove = (event) => {
    event.stopPropagation()

    const xfo = draggedGeom.getParameter('GlobalXfo').getValue()
    const dist = event.pointerRay.intersectRayPlane(geomRay)
    xfo.tr = event.pointerRay.pointAtDist(dist).add(offset)
    draggedGeom.getParameter('GlobalXfo').setValue(xfo)
  }
  const pointerUp = (event) => {
    event.stopPropagation()

    renderer.getViewport().off('pointerMove', pointerMove)
    renderer.getViewport().off('pointerUp', pointerUp)
    targetMaterial.getParameter('BaseColor').setValue(new Color(1, 0, 0))
  }
  renderer.getViewport().on('pointerDown', (event) => {
    if (event.intersectionData) {
      event.stopPropagation()

      draggedGeom = event.intersectionData.geomItem
      geomRay.dir = event.pointerRay.dir.negate()
      geomRay.start = draggedGeom.getParameter('GlobalXfo').getValue().tr
      offset = geomRay.start.subtract(event.pointerRay.pointAtDist(event.intersectionData.dist))

      targetMaterial.getParameter('BaseColor').setValue(new Color(1, 1, 1))
      renderer.getViewport().on('pointerMove', pointerMove)
      renderer.getViewport().on('pointerUp', pointerUp)
    }
  })

  const cbxShowXfoHandler = document.getElementById('show-xfo-handler')
  cbxShowXfoHandler.addEventListener('change', (event) => {
    event.target.checked ? xfoHandle.setVisible(true) : xfoHandle.setVisible(false)
  })
}
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