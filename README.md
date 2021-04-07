# Zea Kinematics

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]

# Introduction
This is a plug-in for [ZeaEngine](https://docs.zea.live/zea-engine) with features that enable the motion of points, bodies and system of bodies. In other words, animation of your objects inside the engine. Pistons, Explode Parts, Aiming, etc.
</br>
</br>
</br>

# Documentation
Full documentation with concepts, tutorials, live examples, API documentation and more; can be found at the zea ux docs site:
[https://docs.zea.live/zea-kinematics](https://docs.zea.live/zea-kinematics)

These docs allow developers to get started with the Zea UX by downloading free and open-source demo content and using Zea's publicly distributed client-side libraries.
</br>
</br>
</br>

# Licensing
The Zea Kinematics in is under a [`MIT`](https://en.wikipedia.org/wiki/MIT_License) license.
</br>
</br>
</br>

# Add it to your project
The process to add Zea Kinematics to your projects is easy. 

## *Using CDNs*
For static websites or quick implementation you can always use CDNs like JsDelivr or Unpkg:

### *JsDelivr*
```html
<script crossorigin src="https://cdn.jsdelivr.net/npm/@zeainc/zea-kinematics/dist/index.umd.min.js"></script>
```
### *Unpkg*
```html
<script crossorigin src="https://unpkg.com/@zeainc/zea-kinematics/dist/index.umd.js"></script>
```
### *Use it*
```html
<script>
  const { AimOperator } = globalThis.zeaKinematics
</script>
```

## *As a Module*
But if you want to use it like a module, then install the package in your project using `npm` or `yarn`:

```bash
npm i @zeainc/zea-kinematics
## Or
yarn add @zeainc/zea-kinematics
```

### *Use it*
```javascript
import { AimOperator } from '@zeainc/zea-kinematics'
// ...
```
</br>
</br>
</br>

# Dependencies
This plug-in depends on [ZeaEngine](https://docs.zea.live/zea-engine) and [ZeaUX](https://docs.zea.live/zea-ux). So, if you're using CDNs, make sure to import these two libraries before kinematics.
</br>


> For questions on licensing, please fill out the contact form on our website: [_zea.live_](https://www.zea.live/contact-us)

[npm]: https://badge.fury.io/js/%40zeainc%2Fzea-kinematics.svg
[npm-url]: https://www.npmjs.com/package/@zeainc/zea-kinematics
[build-size]: https://badgen.net/bundlephobia/minzip/@zeainc/zea-kinematics
[build-size-url]: https://bundlephobia.com/result?p=@zeainc/zea-kinematics
[npm-downloads]: https://img.shields.io/npm/dw/@zeainc/zea-kinematics
[npmtrends-url]: https://www.npmtrends.com/@zeainc/zea-kinematics
