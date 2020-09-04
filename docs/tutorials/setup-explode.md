[//]: <> (Author: Alvaro Pajaro)
[//]: <> (Last Modified: June 9, 2020)

# How-To Setup Exploded View
Maybe one of the most amazing features in the engine, letting you split up all the parts of the model and show how they are assembled. Very useful in descriptive manuals.

?> You can download the source code and the `.zcad` file using the "**Download**" button below the live example.

<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/explode-operator?path=package.json&previewSize=100"
    title="explode-operator on Glitch"
    allow="geolocation; microphone; camera; midi; vr; encrypted-media"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>
<br>

#### Source Code
Here is where things start to increase complexity, probably needing to test around your solutions.

1. Create your `ExplodePartsOperator`(As many as you need), and add them to your asset right after creating it. Then you can start configuring its parameters.
``` javascript
const opExplodeFront1 = new ExplodePartsOperator("opExplodeFront1")
asset.addChild(opExplodeFront1)
opExplodeFront1.getParameter('Dist').setValue(1.6)
opExplodeFront1.getParameter('Stages').setValue(0)
opExplodeFront1.getParameter('Cascade').setValue(true)
```

2. Create a `RouterOperator` object and add it to your asset
```javascript
const explodedAmount = new RouterOperator('ExplodeAmount')
explodedAmount.addRoute().setParam(opExplodeFront1.getParameter('Explode'))
asset.addChild(explodedAmount)
```

3. Group up the asset parts you want to move as one part and add it to the `ExplodePArtsOperator`.
```javascript
  const group = new Group('bolts')
  group.getParameter('InitialXfoMode').setValue('average')
  asset.addChild(group)

  group.resolveItems([
    ['servomestre', 'Part1'],
    ['servomestre', 'Symmetry of Part1'],
    ['servomestre', 'Symmetry of Symmetry of Part1'],
    ['servomestre', 'Symmetry of Part1_018', 'Symmetry of Part1'],
  ])

  const part = opExplodeFront1.getParameter('Parts').addElement()
  part.getParameter('Axis').setValue(new Vec3(0, 0.02, 0))
  part.getOutput().setParam(group.getParameter('GlobalXfo'))
```

4. Finally, set the value for the `Input parameter` in the `RouterOperator` object.
```javascript
  explodedAmount.getParameter('Input').setValue(0)
```

!>  [Zea Engine](https://github.com/ZeaInc/zea-engine) and [Zea Kinematics](https://github.com/ZeaInc/zea-cad) packages are the only two dependencies we have. For quicker implementation you can use the CDNs (as we do in the example code).

```javascript
  import { MathFunctions, Vec3, Xfo, Color, Material, TreeItem, GeomItem, Cuboid, Cylinder, Sphere, Group, Scene, GLRenderer } from '../libs/zea-engine/dist/index.esm.js'
  import { ExplodePartsOperator } from '../libs/zea-kinematics/dist/index.rawimport.js'

  const domElement = document.getElementById('viewport')

  const scene = new Scene()
  scene.setupGrid(10, 10)
  const renderer = new GLRenderer(domElement, { webglOptions: { antialias: false } })
  renderer.setScene(scene)

  // const position = new Vec3({'x': 1.2,'y': 0.02,'z': 0.21})
  // const target = new Vec3({ 'x': 0.0, 'y': 0.0, 'z': 0.15})
  // renderer.getViewport().getCamera().setPositionAndTarget(position, target)


  const treeItem = new TreeItem("tree")
  scene.getRoot().addChild(treeItem)
  

  const opExplode = new ExplodePartsOperator("opExplode")
  opExplode.getParameter('Dist').setValue(0.8)
  opExplode.getParameter('Cascade').setValue(true)
  treeItem.addChild(opExplode)

  // Bolts Front
  {
    const boltGeom = new Cuboid(0.05, 0.05, 0.1)
    const boltMat = new Material('boltMat', 'SimpleSurfaceShader')
    boltMat.getParameter('BaseColor').setValue(new Color(0.2, 0.2, 0.2))
    {
      const group = new Group('boltsGroup')
      group.getParameter('InitialXfoMode').setValue('average')
      treeItem.addChild(group)

      const addBolt = (name, pos) =>{
        const bolt1 = new GeomItem('Bolt1', boltGeom, boltMat)
        const xfo = new Xfo()
        xfo.tr = pos
        xfo.ori.setFromAxisAndAngle(new Vec3(0, 1, 0), Math.PI * 0.5)
        bolt1.getParameter('LocalXfo').setValue(xfo)
        treeItem.addChild(bolt1)
        group.addItem(bolt1)
      }

      addBolt('Bolt1', new Vec3(0.2, 0.2, 0.2))
      addBolt('Bolt2', new Vec3(0.2,-0.2, 0.2))
      addBolt('Bolt3', new Vec3(0.2,-0.2,-0.2))
      addBolt('Bolt4', new Vec3(0.2, 0.2,-0.2))
      const part = opExplode.getParameter('Parts').addElement()
      part.getParameter('Axis').setValue(new Vec3(1, 0, 0))
      part.getOutput().setParam(group.getParameter('GlobalXfo'))
    }
  }

  // Casing

  const casingGeom = new Cylinder(0.5, 0.2, 30)
  const casingMat = new Material('casingMat', 'SimpleSurfaceShader')
  casingMat.getParameter('BaseColor').setValue(new Color(1, 0, 0))
  {
    const casing1 = new GeomItem('Casing1', casingGeom, casingMat)
    const xfo = new Xfo()
    xfo.tr.set(0.1, 0, 0)
    xfo.ori.setFromAxisAndAngle(new Vec3(0, 1, 0), Math.PI * 0.5)
    casing1.getParameter('LocalXfo').setValue(xfo)
    treeItem.addChild(casing1)

    
    const part = opExplode.getParameter('Parts').addElement()
    part.getParameter('Axis').setValue(new Vec3(1, 0, 0))
    part.getOutput().setParam(casing1.getParameter('GlobalXfo'))
  }
  {
    const casing2 = new GeomItem('Casing2', casingGeom, casingMat)
    const xfo = new Xfo()
    xfo.tr.set(-0.1, 0, 0)
    xfo.ori.setFromAxisAndAngle(new Vec3(0, 1, 0), Math.PI * -0.5)
    casing2.getParameter('LocalXfo').setValue(xfo)
    treeItem.addChild(casing2)

    
    const part = opExplode.getParameter('Parts').addElement()
    part.getParameter('Axis').setValue(new Vec3(-1, 0, 0))
    part.getOutput().setParam(casing2.getParameter('GlobalXfo'))
    part.setStage(1)
  }

  // Internals

  const internalsMat = new Material('casingMat', 'SimpleSurfaceShader')
  internalsMat.getParameter('BaseColor').setValue(new Color(0, 1, 0))
  {
    const internalsGeom = new Sphere(0.1, 30)
    const internals1 = new GeomItem('internals1', internalsGeom, internalsMat)
    const xfo = new Xfo()
    xfo.tr.set(0.0, 0, 0.1)
    internals1.getParameter('LocalXfo').setValue(xfo)
    treeItem.addChild(internals1)

    
    const part = opExplode.getParameter('Parts').addElement()
    part.getParameter('Axis').setValue(new Vec3(0, 0, 1))
    part.getOutput().setParam(internals1.getParameter('GlobalXfo'))
    part.setStage(2)
  }

  {
    const internalsGeom = new Sphere(0.2, 30)
    const internals2 = new GeomItem('internals2', internalsGeom, internalsMat)
    const xfo = new Xfo()
    xfo.tr.set(0.0, 0, -0.1)
    internals2.getParameter('LocalXfo').setValue(xfo)
    treeItem.addChild(internals2)

    
    const part = opExplode.getParameter('Parts').addElement()
    part.getParameter('Axis').setValue(new Vec3(0, 0, -1))
    part.getOutput().setParam(internals2.getParameter('GlobalXfo'))
    part.setStage(2)
  }

  
  renderer
    .getViewport()
    .getCamera()
    .setPositionAndTarget(new Vec3(5, 15, 10), new Vec3(0, 0, 0))
  renderer.frameAll()


  const explodedAmountParam = opExplode.getParameter('Explode')
  let explodedAmountP = 0;
  const timerCallback = () => {
      explodedAmountP += 0.01;
      explodedAmountParam.setValue(MathFunctions.smoothStep(0.0, 1.0, explodedAmountP));
      if (explodedAmountP < 1.0) {
        setTimeout(timerCallback, 20); // Sample at 50fps.
      }
  };
  setTimeout(timerCallback, 500); // half second delay
```

## API Class Reference
- [ExplodePartsOperator](api/ExplodePartsOperator)