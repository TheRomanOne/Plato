import * as THREE from "three"
import {createObject} from '../PlatoUtils'

let addWater = (context, props) =>
{
    let { position, rotation=[0, 0, 0], scale=[1, 1, 1] } = props;
    let rnd = (n) =>  n + (1-n) * Math.random()

    let water = new THREE.Object3D();
    water.name = "water"
    water.add( createObject( context, 
            {
                name: 'Water',
                type: 'cube',
                position, scale: [context.unit, context.unit/5, context.unit],
                color: 0x21c1e0,
                rotation,
                castShadow: false,
                shininess: 1,
                shaderUniforms:
                {
                    enableWind: {value: 1},
                }
            }
            ))
    
    
    context.pickableObjects.add(water);
    // context.scene.add(water);
    
    return water;
}

export {addWater}