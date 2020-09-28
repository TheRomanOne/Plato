import * as THREE from "three"
import {createObject} from './ObjectFactory'

let makeRock = (context, props) =>
{
    let { position, rotation=[0, 0, 0], scale=[1, 1, 1] } = props;
    let rnd = (n) =>  n + (1-n) * Math.random()
    // console.log("Props", props)
    let times = 1//Math.ceil(Math.random() * 3);
    let rocks = new THREE.Object3D()
    rocks.name = "rocks"
    for(let i=0; i < times; i++)
    {
        let s = [
            1 + Math.random(),
            1+Math.floor(Math.random() * 2)
        ]
        let r = [
            Math.random() * 180,
            Math.random() * 180,
            Math.random() * 180
        ]
        rocks.add( createObject( context, 
        {
            name: 'Rock',
            type: 'tetrahedron',
            position, scale: s, rotation: r,
            color: 0x959887,
          
        }))
    }
  
  return rocks;
}

export {makeRock}