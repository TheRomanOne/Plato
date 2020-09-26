import * as THREE from "three"
import { createObject } from './PlatoUtils'
import { MapController } from "./MapController"

function printf(x)
{
    console.log(x);
}

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
                        y,
                        Math.floor(.5 + z / this.unit)*this.unit - this.world.position.z
                    )
                    break;
                }
            }
            
        });

        addEventListener("keydown", event =>
        {
          if(event.code === "ArrowUp")
          {
            this.map_control.makeMove({x: 0, y: -1}) 
          }else if(event.code === "ArrowDown")
          {
            this.map_control.makeMove({x: 0, y: 1})
          }else if(event.code === "ArrowLeft")
          {
            this.map_control.makeMove({x: -1, y: 0})
          }else if(event.code === "ArrowRight")
          {
            this.map_control.makeMove({x: 1, y: 0})
          }
        });
    }      

    // Light factory
    creatLight(props)
    {
        let {type, position, color, intensity, distance, decay} = props;
        let castShadow = true;

        let _type = null;
        if(type === "point")
            _type = THREE.PointLight;
        else if (type === "ambient")
        {
            _type = THREE.AmbientLight;
            castShadow = false;
        }else if (type === "directional")
            _type = THREE.DirectionalLight;
        
        let _l = new _type(new THREE.Color(color), intensity, distance, decay)
        _l.castShadow = castShadow;
        
        position && _l.position.set(position.x, position.y, position.z);
        this.lights.add(_l);
        return _l;
    }



    initScene()
    {
        this.camera.position.x = 50;
        this.camera.position.y = 100;
        this.camera.position.z = 250;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        let sun = this.creatLight({
            type: "directional",
            position: {x:20, y: 20, z: -20},
            // position: {x:-70, y: 150, z: 70},
            color: 0xbb55aa,
            intensity: .8,
            castShadow: true
        });
        this.lights.remove(sun)
        this.scene.add(sun)
        const d = 70;

        sun.shadow.camera.near = 0.1
        sun.shadow.camera.far = d*5
        sun.shadow.camera.left = - d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = - d;
        // this.scene.add(new THREE.CameraHelper(sun.shadow.camera));

        // Directional shadow stopped working
        // probably after map system implementation
        // look into shadow mapping for directional light

        this.pointerLight = this.creatLight({
            type: "point",
            color: 0x001234,
            intensity: 30,
            distance: 50,
            decay: 1
        });
        this.pointerLight.castShadow = true;
        // this.scene.add(new THREE.CameraHelper(this.pointerLight.shadow.camera));

        this.creatLight({
            type: "ambient",
            color: 0xaaaaaa
        });
        
        // create plane
        this.ground = createObject( this, {
            type: "cube",
            // position: [0, 0, 0],
            scale: [this.mapSize * this.unit, this.unit/2, this.mapSize * this.unit],
            color: 0xa5f066,
            // castShadow: false
        });
        this.ground.castShadow=true
        this.pickableObjects.add(this.ground);

        let pad = createObject( this, 
            {
                position: [0, .5, 0],
                scale: [this.unit, this.unit/8, this.unit],
                color: 0xff3731,
                type: 'cube',
                castShadow: false,
                receiveShadow: false
            }
        );
        pad.material.transparent=true;
        pad.material.opacity=.1;
        this.pointerPad = new THREE.Object3D();
        this.pointerPad.add(pad)
        this.world.add(this.pointerPad)
        
    }

    updateScene()
    {
        this.time +=.1;// 0.1 * (Date.now() - this.start);

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