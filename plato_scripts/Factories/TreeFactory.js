import * as THREE from "three"
import {createObject} from '../PlatoUtils'

let makeTree = (context, props) =>
{
    let { position, rotation=[0, 0, 0], scale=[1, 1, 1] } = props;
    let rnd = (n) =>  n + (1-n) * Math.random()

    let times = 1;
    let tree = new THREE.Object3D();
    tree.name = "tree"
    let trunkScale, trunkPos;
    // for(let i=0; i < times; i++)
    {
        trunkScale = [
            rnd(.7) * scale[0] * context.unit,
            (.5 + rnd(.5) * scale[1]) * context.unit,
            rnd(.85) * scale[2] * context.unit
        ];
        trunkPos = [...position]
        let h = trunkScale[1]
        // h *= 1+ (Math.random()-.5)
        trunkPos[1] += h/2

        let topRad = rnd(.8) * context.unit/5;
        let trunkColor = new THREE.Color(0x986f23)// + (0x0101000 * (Math.random() - .5)))
        // trunkColor.g*=0.3
        // trunkColor.b*=0.3
        trunkColor = trunkColor.getHex()
        tree.add( createObject( context, 
            {
                name: 'Trunk',
                type: 'cylinder',
                position: trunkPos, scale: [topRad, context.unit/5, h],
                color: trunkColor,
                rotation,
                shaderUniforms:
                {
                    enableWind: {value: 0}
                }
            }
            ))

    }
    
    let leavesScale;

    let leavesColor = new THREE.Color(0x00111 + (0x7bd85d + 0x111111 * .015*(Math.random() - .5)))
    leavesColor.r*=0.3
    leavesColor.b*=0.3
    leavesColor = leavesColor.getHex()

    for(let i=0; i < times; i++)
    {
        leavesScale = [
            rnd(.7) * scale[0] * context.unit,
            rnd(.7) * scale[1] * context.unit,
            rnd(.7) * scale[2] * context.unit
        ];
        let p = [...position]
        p[1] += trunkScale[1]
        // if(times > 1) p[1] += Math.random() * trunkScale[1]/2

        tree.add( createObject( context, 
            {
                name: 'Leaves',
                type: 'cube',
                position: p, scale: leavesScale,
                // rotation: [0, Math.random()*360, 0],
                color:leavesColor,
                shaderUniforms:
                {
                    enableWind: {value: 1},
                    height: {value: leavesScale[1]}
                }
            })
        )
    }
    
    context.pickableObjects.add(tree);
    // context.scene.add(tree);
    
    return tree;
}

export {makeTree}