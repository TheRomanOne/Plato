import * as THREE from "three"
import { createObject } from './Factories/ObjectFactory'
import { MapController } from "./MapController"
import { creatLight } from "./Factories/LightFactory"
class PlatoScene
{
    constructor()
    {
        var scene, camera, renderer;
        var h = window.innerHeight;
        var w = window.innerWidth;
        var aspect = w/h;
        this.start = Date.now()
        this.raycaster = new THREE.Raycaster(); 
        this.mouse = new THREE.Vector2();

        camera = new THREE.PerspectiveCamera(15, aspect, 0.1, 1000);
        
        renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(w, h);
        renderer.setClearColor(new THREE.Color(14/156,29/156,84/156)); //0., 216.0/256., 255.0/256.
        renderer.shadowMap.enabled = true;
	    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(renderer.domElement);
        this.time = 0.0001 * (Date.now() - this.start);
        this.shader_uniforms = { time: {type: 'float', value: this.time}}
        scene = new THREE.Scene();

        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.shaders = []

        this.world = new THREE.Object3D()
        this.lights = new THREE.Object3D();
        this.pickableObjects = new THREE.Object3D();
        
        this.world.add(this.lights)
        this.world.add(this.pickableObjects)

        this.scene.add(this.world)

        this.setEventListeners();
        this.updateRender = this.updateRender.bind(this);
        this.unit = 5;
        this.mapSize = 19;
        this.worldSize = 150

        this.map_control = new MapController(this,
        {
            mapSize: this.mapSize,
            worldSize: this.worldSize
        })
        
        // this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

    }
    
    getMouseInteractions()
    {
        this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1; 
        this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1; 
        
        this.raycaster.setFromCamera( this.mouse, this.camera );
        // calculate objects intersecting the picking ray 
        let ints = this.raycaster.intersectObjects( this.pickableObjects.children, true );
        // printf(ints)
        return ints;
    }

    setEventListeners()
    {
        document.body.onresize = () =>
        {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }

        addEventListener( 'click', event =>
        { 
            let intersections = this.getMouseInteractions();
            
            if(intersections.length === 0)
                return;

            for(let i = 0; i < intersections.length; i++)
            {
                if(intersections[i].object.uuid == this.ground.uuid)
                {
                    this.map_control.addTree(this.pointerPad.position)

                    break;
                }
            }
        }, false );  

        addEventListener('mousemove', event =>
        {
            let intersections = this.getMouseInteractions();

            if(intersections.length === 0)
                return;

            for(let i = 0; i < intersections.length; i++)
            {
                if(intersections[i].object.uuid == this.ground.uuid ||intersections[i].object.name == "Water")
                {
                    // hit ground
                    let {x, y, z} = intersections[i].point;
                    this.pointerLight.position.set(x - this.world.position.x, y + this.unit/2, z - this.world.position.z);

                    this.pointerPad.position.set(
                        Math.floor(.5 + x / this.unit)*this.unit - this.world.position.x,
                        0,
                        Math.floor(.5 + z / this.unit)*this.unit - this.world.position.z
                    )
                    break;
                }
            }
            
        });

        addEventListener("keydown", event =>
        {
          console.log(event.code)
          if(event.code === "ArrowUp" || event.code === "KeyW")
          {
            this.map_control.makeMove({x: 0, y: -1}) 
          }else if(event.code === "ArrowDown" || event.code === "KeyS")
          {
            this.map_control.makeMove({x: 0, y: 1})
          }else if(event.code === "ArrowLeft" || event.code === "KeyA")
          {
            this.map_control.makeMove({x: -1, y: 0})
          }else if(event.code === "ArrowRight" || event.code === "KeyD")
          {
            this.map_control.makeMove({x: 1, y: 0})
          }
        });
    }      

    initScene()
    {
        this.camera.position.x = 50;
        this.camera.position.y = 100;
        this.camera.position.z = 250;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        let sun = creatLight({
            type: "directional",
            color: 0xbb55aa,
            intensity: 1.5,
            castShadow: true
        });
        this.sun = sun
        this.lights.remove(sun)
        this.scene.add(sun)
        let d = 60;

        sun.shadow.camera.near = 0.1
        sun.shadow.camera.far = d*3
        sun.shadow.camera.left = - d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = - d;        
        // this.scene.add(new THREE.CameraHelper(sun.shadow.camera));

        let moon = creatLight({
            type: "directional",
            color: 0x2345ff,
            intensity: .3,
            castShadow: true
        });
        this.moon = moon
        this.lights.remove(moon)
        this.scene.add(moon)
        d = 60;

        moon.shadow.camera.near = 0.1
        moon.shadow.camera.far = d*3
        moon.shadow.camera.left = - d;
        moon.shadow.camera.right = d;
        moon.shadow.camera.top = d;
        moon.shadow.camera.bottom = - d;        
        // this.scene.add(new THREE.CameraHelper(moon.shadow.camera));


        this.pointerLight = creatLight({
            type: "point",
            color: 0x002377,
            position: new THREE.Vector3(0, 5, 0),
            intensity: 10,
            distance: 40,
            decay: 1
        });
        this.pointerLight.castShadow = true;
        this.lights.add(this.pointerLight);
        // this.scene.add(new THREE.CameraHelper(this.pointerLight.shadow.camera));

        this.ambient = creatLight({
            type: "ambient",
            color: 0xff0000,
            position: {x:0, y:100, z: 0}
        })
        
        this.lights.add( this.ambient );
        
        // create plane
        this.ground = createObject( this, {
            type: "cube",
            scale: [this.mapSize * this.unit, this.unit/2, this.mapSize * this.unit],
            // color: 0xa5f066,
            color: 0xa5f066,
            castShadow: true
        });
        this.ground.receiveShadow=true
        this.pickableObjects.add(this.ground);

        let pad = createObject( this, 
            {
                position: [0, 2, 0],
                scale: [this.unit, this.unit/8, this.unit],
                color: 0xff3333,
                type: 'cube',
                castShadow: false,
                receiveShadow: false
            }
        );
        pad.material.transparent=true;
        pad.material.opacity=.7;
        this.pointerPad = new THREE.Object3D();
        this.pointerPad.add(pad)
        this.world.add(this.pointerPad)
        
    }

    updateScene()
    {
        this.time +=.1;// 0.1 * (Date.now() - this.start);
        // let t = -3.14/2
        let t = this.time/10
        
        let color1 = new THREE.Color(0x002377)
        let color2 = new THREE.Color(0xaaaaaa)
        let param = Math.max(0, Math.sin(t))
        let c = color1.lerp(color2, param)
        this.ambient.color.set(new THREE.Color(c))   
        
        let cl = new THREE.Color(14/156,29/156,84/156)
        let cl2 = new THREE.Color(10/250,20/250,54/220)
        this.renderer.setClearColor(cl2.lerp(cl, Math.sin(t))); //0., 216.0/256., 255.0/256.

        this.moon.position.set(
            90 * Math.sin(t*.5),
            70  + 50 * Math.sin(t*.3),
            90 * Math.cos(t*.5)
        )

        this.sun.position.set(
            90 * Math.sin(t),
            50 * Math.sin(t),
            90 * Math.cos(t)
        )
        
        this.shaders.forEach(s =>
            {
                s.uniforms.time.value = this.time
            })
    }

    updateRender()
    {
        requestAnimationFrame(this.updateRender);

        this.updateScene();
        this.renderer.render( this.scene, this.camera );
    }

    run()
    {
        this.map_control.generateMap()
        this.initScene();
        this.updateRender();
    }
}

export { PlatoScene };