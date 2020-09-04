[//]: <> (Author: Philip Taylor)
[//]: <> (Last Modified: June 12, 2020)

# How-To Setup the Aim Operator
When working with gears, making them spin gives life to your scene. By showing how each element in your machine interacts with others. The Zea Engine has a class specifically for gears, and contrary to what you could think, it is not hard to implement, let's see an example.
<br>


<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/aim-operator?path=package.json&previewSize=100"
    title="aim-operator on Glitch"
    allow="geolocation; microphone; camera; midi; vr; encrypted-media"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>
<br>
<br>
___

## Main Concepts In This How-To

|Concept|Use|
|-| -|
|Gear|Toothed wheel that works with others to alter the relation between the speed of a driving mechanism|
|RPM|Revolutions per minute, how many complete rotations the gear will do in a minute |
|Ratio|Relation between RPM and the speed of the gear. How many times the RPM will rotate the gear|
|Axis|A straight line around which the object will rotate, remember that it is a Vec3(x,y,z)|


#### Source Code
In our example, we create the gears from zero(Using Cylinders and assigning Materials), but it is very likely that you will have assets with proper designs(Real cogs, etc.), it would reduce the amount of code you will write.
<br>

1. If you have the assets, you only need to instantiate an object of `GearParameter` class and add it to your asset.
Also set RPM(revolutions per minute) value.
```javascript
const gearsOp = new GearsOperator('Gears')
asset.addChild(gearsOp)
const rpmParam = gearsOp.getParameter('RPM')
rpmParam.setValue(5)
```

2. Then you assign the gears operator to your group or item you want to rotate. In this example we assign it to a group, yout as you can see in the code of the live code, we do it to an item.
```javascript
const gear = gearsOp.getParameter('Gears').addElement()
gear.getMember('Ratio').setValue(1)
gear.getMember('Axis').setValue(new Vec3(0, 0, 1))
gear.getOutput().setParam(group.getParameter('GlobalXfo'))
```

And that's it! Not that complicated, eh?

!>  [Zea Engine](https://github.com/ZeaInc/zea-engine) and [Zea Kinematics](https://github.com/ZeaInc/zea-cad) packages are the only two dependencies we have. For quicker implementation, you can use the CDNs (as we do in the example code).

```javascript
  import { Vec3, Xfo, Color, Material, TreeItem, GeomItem, Cylinder, Scene, GLRenderer } from '../libs/zea-engine/dist/index.esm.js'
  import { GearsOperator } from '../libs/zea-kinematics/dist/index.rawimport.js'

  const domElement = document.getElementById("viewport")

  const scene = new Scene()
  scene.setupGrid(10.0, 10)

  const treeItem = new TreeItem("tree")
  scene.getRoot().addChild(treeItem)

  const gearsOp = new GearsOperator("Gears")
  treeItem.addChild(gearsOp)

  let index = 0
  let sign = 1
  let prevTeeth = 0
  let prevRatio = 1.0
  const addGear = (pos, radius, teeth, axis, color) => {
    const gearGeom = new Cylinder(radius, 0.2, teeth)
    const gearMaterial = new Material('gearmaterial', 'SimpleSurfaceShader')
    gearMaterial.getParameter('BaseColor').setValue(color)
    const geomItem = new GeomItem('gear' + index++, gearGeom, gearMaterial)
    const xfo = new Xfo()
    xfo.tr = pos
    geomItem.getParameter('LocalXfo').setValue(xfo)
    treeItem.addChild(geomItem)

    const ratio = (prevTeeth > 0 ? prevTeeth / teeth : 1.0) * sign
    console.log(index, ratio)
    prevTeeth = teeth
    prevRatio = ratio
    sign = -sign

    const gear = gearsOp.getParameter('Gears').addElement()
    gear.getMember('Ratio').setValue(ratio)
    gear.getMember('Axis').setValue(axis)
    gear.getOutput().setParam(geomItem.getParameter('GlobalXfo'))
  }
  addGear(new Vec3(0, 0, 0), 2.5, 12, new Vec3(0, 0, 1), new Color(1.0, 0.0, 0.0))
  addGear(new Vec3(3.5, 0, 0), 1.2, 8, new Vec3(0, 0, 1), new Color(0.0, 0.0, 1.0))
  addGear(new Vec3(3.5, 1.6, 0), 0.6, 5, new Vec3(0, 0, 1), new Color(1.0, 1.0, 0.0))

  const rpmParam = gearsOp.getParameter('RPM')
  rpmParam.setValue(12.0)
  rpmParam.setRange([0, 60])

  const renderer = new GLRenderer(domElement)
  renderer.setScene(scene)
  renderer
    .getViewport()
    .getCamera()
    .setPositionAndTarget(new Vec3(15, 15, 10), new Vec3(0, 0, 0))
  renderer.frameAll()
```
___
## API Class References
- [AimOperator](api/AimOperator)

