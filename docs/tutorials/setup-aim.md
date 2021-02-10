[//]: <> (Author: Philip Taylor)
[//]: <> (Last Modified: June 12, 2020)

# How-To Setup the Aim Operator
The AimOperator is used to align aon object with a target.
<br>


<!-- Copy and Paste Me -->
<div class="glitch-embed-wrap" style="height: 420px; width: 100%;">
  <iframe
    src="https://glitch.com/embed/#!/embed/aim-operator?path=index.html&previewSize=100&attributionHidden=true"
    title="aim-operator on Glitch"
    allow="vr"
    style="height: 100%; width: 100%; border: 0;">
  </iframe>
</div>

<br>
<br>
___

## Main Concepts In This How-To

#### Source Code
In our example, we use the AimOperator to rotate the cone to always point at the sphere, whether the cone is moved or the sphere.
<br>

1. You need to instantiate an object of `AimOperator` class and configure some of its settings.
```javascript
  const aimOp = new AimOperator("AimOp");
  aimOp.getParameter("Axis").setValue(4);
```

To make the aim operator stretch the object towards the target, you can enable stretch.
```javascript
  aimOp.getParameter('Stretch').setValue(true)
```

2. Then you assign the The input and the output of the operator to parameters on other objects. 
> Note: The inputs and outputs should almost always be connected to 'GlobalXfo'.
```javascript
aimOp.getInput("Target").setParam(targGeomItem.getParameter("GlobalXfo"));
aimOp.getOutput("InputOutput").setParam(aimGeomItem.getParameter("GlobalXfo"));
```

And that's it! Not that complicated, eh?

!>  [Zea Engine](https://github.com/ZeaInc/zea-engine) and [Zea Kinematics](https://github.com/ZeaInc/zea-kinematics) packages are the only two dependencies we have. For quicker implementation, you can use the CDNs (as we do in the example code).

```javascript
  const {
    Vec3,
    Xfo,
    Ray,
    Color,
    Material,
    TreeItem,
    GeomItem,
    Cone,
    Sphere,
    Scene,
    GLRenderer
  } = window.zeaEngine;

  const { AimOperator } = window.zeaKinematics;

  const domElement = document.getElementById("renderer");

  const scene = new Scene();
  const renderer = new GLRenderer(domElement);
  renderer.setScene(scene);
  renderer
    .getViewport()
    .getCamera()
    .setPositionAndTarget(new Vec3(3, 3, 1), new Vec3(0, 0, 0));

  scene.setupGrid(10.0, 10);

  const treeItem = new TreeItem("tree");
  scene.getRoot().addChild(treeItem);

  const aimGeom = new Cone(0.2, 1.0, 30, true);
  const aimGeomMaterial = new Material(
    "aimGeomMaterial",
    "SimpleSurfaceShader"
  );
  aimGeomMaterial.getParameter("BaseColor").setValue(new Color(1, 0, 0));
  const aimGeomItem = new GeomItem("aim", aimGeom, aimGeomMaterial);
  treeItem.addChild(aimGeomItem);

  const targGeom = new Sphere(0.04, 30);
  const targGeomMaterial = new Material(
    "targGeomMaterial",
    "SimpleSurfaceShader"
  );
  targGeomMaterial.getParameter("BaseColor").setValue(new Color(0, 1, 0));
  const targGeomItem = new GeomItem("aim", targGeom, targGeomMaterial);
  const targXfo = new Xfo();
  targXfo.tr.set(-1, 1, 1);
  targGeomItem.getParameter("LocalXfo").setValue(targXfo);
  treeItem.addChild(targGeomItem);

  const aimOp = new AimOperator("AimOp");
  aimOp.getParameter("Axis").setValue(4);
  // aimOp.getParameter('Stretch').setValue(true)
  aimOp.getInput("Target").setParam(targGeomItem.getParameter("GlobalXfo"));
  aimOp
    .getOutput("InputOutput")
    .setParam(aimGeomItem.getParameter("GlobalXfo"));
  treeItem.addChild(aimOp);

  // //////////////////////////////////////////////
  // Make the target draggable.
  targGeomItem.on("pointerEnter", event => {
    targGeomMaterial.getParameter("BaseColor").setValue(new Color(1, 1, 1));
  });
  targGeomItem.on("pointerLeave", event => {
    targGeomMaterial.getParameter("BaseColor").setValue(new Color(0, 1, 0));
  });

  let draggedGeom;
  const geomRay = new Ray();
  const pointerMove = event => {
    event.stopPropagation();

    const xfo = draggedGeom.getParameter("GlobalXfo").getValue();
    const dist = event.pointerRay.intersectRayPlane(geomRay);
    xfo.tr = event.pointerRay.pointAtDist(dist);
    draggedGeom.getParameter("GlobalXfo").setValue(xfo);
  };

  const pointerUp = event => {
    event.stopPropagation();

    renderer.getViewport().off("pointerMove", pointerMove);
    renderer.getViewport().off("pointerUp", pointerUp);
  };

  renderer.getViewport().on("pointerDownOnGeom", event => {
    event.stopPropagation();

    draggedGeom = event.intersectionData.geomItem;

    // geomRay.dir = event.viewport.getCamera().getParameter('GlobalXfo').getValue().ori.getZaxis().negate()
    geomRay.dir = event.pointerRay.dir.negate();
    geomRay.start = draggedGeom.getParameter("GlobalXfo").getValue().tr;

    renderer.getViewport().on("pointerMove", pointerMove);
    renderer.getViewport().on("pointerUp", pointerUp);
  });
```
___
## API Class References
- [AimOperator](api/AimOperator)

