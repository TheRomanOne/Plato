import * as THREE from "three"
import {createObject} from './ObjectFactory'

let makeRock = (context, props) =>
{
    let { position, rotation=[0, 0, 0], scale=[1, 1, 1] } = props;
    let rnd = (n) =>  n + (1-n) * Math.random()
    // console.log("Props", props)
    let times = 1//Math.ceil(Math.random() * 3);
    let rocks = new THREE.Object3D()
    let unit = 1
    rocks.name = "rocks"
    for(let i=0; i < times; i++)
    {
        let s = [
            unit * (1 + Math.random()),
            unit * (1+Math.floor(Math.random() * 2))
        ]
        let r = [
            Math.random() * 180,
            Math.random() * 180,
            Math.random() * 180
        ]
        // let os=context.unit
        // let h = 0
        // let offset = [
        //     Math.random()*os - h,
        //     Math.random()*os - h,
        //     Math.random()*os - h
        // ]
        // position[0] += offset[0] 
        // // position[1] += offset[1] 
        // position[2] += offset[2] 
        rocks.add( createObject( context, 
        {
            name: 'Rock',
            type: 'tetrahedron',
            position, scale: s, rotation: r,
            color: 0x959887,
        }))
    }
    // rock.scale.set(new THREE.Vector3(1, 1, 1))
    context.pickableObjects.add(rocks);
    // context.scene.add(tree);
    
    return rocks;
}

export {makeRock}