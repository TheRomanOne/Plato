import * as THREE from "three"
import {ShaderMaker} from '../Shaders'

let createObject = (context, props) =>
{
    let { type, name,
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = [10, 10, 10],
            color = 0xaaabaa,
            castShadow = true,
            receiveShadow = true,
            shininess,
            shaderUniforms=
            {
                enableWind: {value: 0}
            }
        } = props;

    let param1 = scale[0]?scale[0]:null,
        param2 = scale[1]?scale[1]:null,
        param3 = scale[2]?scale[2]:null;

    let geom = null, geomType = null
    if(type === "cube")
        geomType = THREE.BoxGeometry;
    else if(type === "cylinder")
    {
        geomType = THREE.CylinderGeometry;
    }else if(type === "tetrahedron")
    {
        geomType = THREE.TetrahedronBufferGeometry;
        // geomType = THREE.DodecahedronBufferGeometry;
    }

    if(param3)
        geom = new geomType(param1, param2, param3)
    else geom = new geomType(param1, param2)

    let material = new THREE.MeshPhongMaterial({color: new THREE.Color(color)});
    material.receiveShadow=true
    material.needsUpdate = true;
    if(shininess) material.shininess = shininess;
    material.onBeforeCompile = (shader) =>
    {
        shader.uniforms = {
            ...shader.uniforms,
            ...shaderUniforms,
            color: {value: new THREE.Color(color)},
            time: {value: 0},
        }
        
        let sm = new ShaderMaker({shader})
        shader.vertexShader = sm.vertexShader
        shader.fragmentShader = sm.fragmentShader;

        context.shaders.push(shader)
    }

    
    // material.customDepthMaterial = new THREE.MeshDepthMaterial(0x333333)
    let mesh = new THREE.Mesh(geom, material);
    
    // mesh.customDepthMaterial = new THREE.MeshDepthMaterial();
    // mesh.customDepthMaterial.onBeforeCompile = (shader) =>
    // {
        
    // }
    
    if(name) mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
}

export {createObject}