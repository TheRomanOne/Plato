/*
    ~~ Inspired by https://codepen.io/yitliu/pen/bJoQLw ~~
    
    A procedurally generated world builder.
    
    ● Use arrows to move around
    ● Place trees with your mouse
    
    So far there's minimal user interaction: A random world will
    be generated (random
    tree and rock placement, same lake function) BUT only a small
    segment of the world is rendered

    GitHub: https://github.com/TheRomanOne/Plato
*/

let keysPressed = {};

let makeEnum = nums =>
{
    let en = {}
    nums.forEach((n, i) => en[n] = i)
    return Object.freeze(en)
}

let CATALOGUE = makeEnum([
    "GROUND", "TREE", "WATER", "ROCK", "GRASS"
])

let SHADER_TYPES = makeEnum([
    "DEFAULT", "GRASS"
])

let probability = {
    TREE: .2,
    ROCK: .1,
    GRASS: .7,
    LAKE: 1
}

// Utils
class MapController
{
    constructor(context, props)
    {
        let {
            mapSize,
            worldSize
        } = props

        this.mapSize = mapSize
        this.worldSize = worldSize
        this.context = context
        this.data = {
            lim_x: mapSize,
            lim_nx: 0,
            lim_y: mapSize,
            lim_ny: 0,
            center: {x: Math.floor(mapSize/2), y: Math.floor(mapSize/2)}
        }
        this.obj3d = new Array(worldSize)
        for(let i=0; i < this.obj3d.length; i++)
            this.obj3d[i] = new Array(worldSize)
        this.gnd3d = new Array(worldSize)
            for(let i=0; i < this.gnd3d.length; i++)
                this.gnd3d[i] = new Array(worldSize)
    }

    glb2loc(coord)
    {
        let i = coord.x
        let j = coord.y
        let h = this.mapSize/2;
        let y = (i - h) * this.context.unit;
        let x = (j - h) * this.context.unit;
        let ofst = this.context.unit/2
        let height = this.data.height[i][j]
        return {x: x + ofst, y: height, z: y + ofst}
    }

    renderCell(coord, type, soft=false)
    {
        let position = this.glb2loc(coord)
        position = [position.x, position.y, position.z]
        let mesh;
        switch(type)
        {
            case CATALOGUE.TREE:
                mesh = makeTree(this.context, { position }); break;
            case CATALOGUE.WATER:
                mesh = makeWater(this.context, { position }); break;
            case CATALOGUE.ROCK:
                mesh = makeRock(this.context, { position }); break;
            case CATALOGUE.GRASS:
                mesh = makeGrass(this.context, { position }); break;
        }
        
        this.obj3d[coord.x][coord.y] = mesh
        if(mesh) this.context.pickableObjects.add(mesh);
        
        if(!soft)
            this.renderGround(coord)
    }

    renderGround(coord)
    {
        let p = this.glb2loc(coord)
        p = [p.x, p.y, p.z]
        let mesh = makeGround(this.context, {position: p})
        this.gnd3d[coord.x][coord.y] = mesh
        this.context.pickableObjects.add(mesh);
    }

    renderMap(map)
    {
        for(let i = 0; i < map.length; i++)
            for(let j = 0; j < map[i].length; j++)
            {
                this.renderCell({x:i, y:j}, map[i][j])            
            }
    }

    makeMove(dir)
    {
        let x = dir.x;
        let y = dir.y;
        let md = this.data

        if(
            md.lim_x + x > this.worldSize ||
            md.lim_nx + x < 0 ||
            md.lim_y + y > this.worldSize ||
            md.lim_ny + y < 0
            ) return;

        /*
            * Update mapLocation
            * 
        */
        let unit = this.context.unit
        
        this.updateMap(dir)

        this.context.world.position.x -= unit * dir.x;
        // this.context.ground.position.x += unit * dir.x;
        
        this.context.world.position.z -= unit * dir.y;
        // this.context.ground.position.z += unit * dir.y;
    }

    updateMap(dir)
    {
        let x = dir.x;
        let y = dir.y;
        let md = this.data

        // Remove old

        if(x!=0)
        {   
            let ofst = (x<0)?md.lim_x-1:md.lim_nx

            for(let j = md.lim_ny; j < md.lim_y; j++)
                this.context.removeCell({x: j, y: ofst})
        }

        if(y!=0)
        {       
            let ofst = (y<0)?md.lim_y-1:md.lim_ny

            for(let j = md.lim_nx; j < md.lim_x; j++)
                this.context.removeCell({x: ofst, y: j})
        }

        
        // Add new
        
        md.center.x += x
        md.lim_x += x
        md.lim_nx += x

        md.center.y += y
        md.lim_y += y
        md.lim_ny += y

        if(x!=0)
        {   
            let ofst = (x>0)?md.lim_x-1:md.lim_nx

            for(let j = md.lim_ny; j < md.lim_y; j++)
            {
                let type = this.data.world[j][ofst]
                this.renderCell({x: j, y: ofst}, type)
            }
        }

        if(y!=0)
        {   
            let ofst = (y>0)?md.lim_y-1:md.lim_ny

            for(let j = md.lim_nx; j < md.lim_x; j++)
            {
                let type = this.data.world[ofst][j]
                this.renderCell({x: ofst, y: j}, type)
            }
        }
    }

    // API
    pos2world(position)
    {
        let {x, z} = position;
        let h = this.mapSize/2;
        let i = Math.floor(h + x / this.context.unit);
        let j = Math.floor(h + z / this.context.unit);
        
        return {x:j, y:i}
    }

    drawObject(position, type, cond, soft=false)
    {
        let cell = this.pos2world(position)
        let {x, y} = cell
        let allowed = true
        if(cond != undefined && this.data.world[x][y] != cond)
            allowed = false
        if(allowed)
        {
            this.renderCell(cell, type, soft)
            this.data.world[x][y] = type
        }
    }
    
    drawTree(position)
    {
        this.drawObject(position, CATALOGUE.TREE, CATALOGUE.GROUND, true)
    }

    generateMap()
    {

        // init empty map
        let wmap = new Array(this.worldSize)
        for(let i = 0; i < wmap.length; i++)
        {
            wmap[i] = new Array(this.worldSize)
            for(let j = 0; j < wmap[i].length; j++)
            wmap[i][j] = 0
        }

        let hmap = new Array(this.worldSize)
        for(let i = 0; i < hmap.length; i++)
        {
            let fi = i/hmap.length
            hmap[i] = new Array(this.worldSize)
            for(let j = 0; j < hmap[i].length; j++)
            {
                let fj = j/hmap.length
                hmap[i][j] = Math.random()
                hmap[i][j] += 1 + 2.25 * (Math.sin(fi * 3.14 * 25) + Math.cos(fj * 3.14 * 25))
            }
        }

        // Lake function
        // let f = x => -5+x + 5*Math.sin(x/7)
        let f = (x, y) => -5 + x + 5 * Math.cos(x/7) + 3 * Math.cos(y)
        
        // Iterate over cells
        for(let i = 0; i < wmap.length; i++)
        {
            // Add grass
            for(let j = 0; j < wmap[i].length; j++)
            wmap[i][j] = (Math.random() < probability.GRASS) ? CATALOGUE.GRASS : CATALOGUE.GROUND

            // Add trees
            for(let j = 0; j < wmap[i].length; j++)
                if(Math.random() < probability.TREE)
                    wmap[i][j] = CATALOGUE.TREE

            // Add rocks
            for(let j = 0; j < wmap[i].length; j++)
                if(Math.random() < probability.ROCK)
                    wmap[i][j] = CATALOGUE.ROCK

            // Add water
            if(probability.LAKE == 1)
            {
                let y = new THREE.Vector2(i, Math.ceil(f(i, Math.random() * 3.14/2)))
                for(let j=0; j<wmap[i].length; j++)
                {
                    let d = y.distanceTo(new THREE.Vector2(i, j))
                    if(d < 3)
                    {
                        wmap[i][j] = CATALOGUE.WATER
                        hmap[i][j] = -.5
                    }else if(d < 4)
                        hmap[i][j] = 1
                    else if(d < 5)
                        hmap[i][j] = 1.5
                    else if(d < 6)
                        hmap[i][j] = 2
                }
            }
            
        }


        let map = new Array(this.mapSize)
        for(let i = 0; i < map.length; i++)
        {
            map[i] = new Array(this.mapSize)
            for(let j = 0; j < map[i].length; j++)
            {
                let loc_x = this.data.center.x + i - Math.floor(this.mapSize / 2)
                let loc_y = this.data.center.y + j - Math.floor(this.mapSize / 2)
                map[i][j] = wmap[loc_x][loc_y]
            }
        }
        

        this.data.world = wmap
        this.data.height = hmap
        this.renderMap(map)
    }
}


// Factories
class MaterialMaker
{
    constructor(context)
    {
        this.context = context
        this.raw_material = new THREE.RawShaderMaterial( {
            side: THREE.DoubleSide,
            transparent: true
        } )
    
        this.phong_material = new THREE.MeshPhongMaterial();
        this.shader_maker = new ShaderMaker()
    }

    make = (shaderUniforms, shader_type) =>
    {
        let material
        switch(shader_type)
        {
            case SHADER_TYPES.GRASS:
                material = this.raw_material; break;
            default:
                material = this.phong_material
        }
        material = material.clone()
        material.needsUpdate = true;
        let {uuid} = material
        material.onBeforeCompile = (shader) =>
        {
            shader.uniforms = {
                ...shader.uniforms,
                ...shaderUniforms,
                time: {value: 0},
            }
            
            let shaders = this.shader_maker.make(shader_type)
            shader.vertexShader = shaders.vertex
            shader.fragmentShader = shaders.fragment;

            this.context.shaders[uuid] = shader
        }

        return material
    }
}

class ShaderMaker
{
  constructor()
  {
    this.phong_shader_v = this.read_shader('phong_shader_v')
    this.phong_shader_f = this.read_shader('phong_shader_f')
  }

  make = type =>
  {
    let v = this.phong_shader_v
    let f = this.phong_shader_f
    let shaders = {vetex: '', fragment: ''}
    switch(type)
    {
        case SHADER_TYPES.DEFAULT:
            shaders.vertex = this.read_shader('vertex_uniforms') +
            // this.read_shader('vertex_utils') + 
            this.read_shader('transpose') + 
            this.read_shader('apply_wind') + 
                v.replace('#include <project_vertex>', this.read_shader( 'project_vertex' ));
            shaders.fragment =  this.read_shader('fragment_uniforms') +
                f.replace('#include <dithering_fragment>',this.read_shader('dithering_fragment'))
            break
        case SHADER_TYPES.GRASS:
            // v = this.phong_shader_v
            // this.vertexShader = this.read_shader('vertex_uniforms') + this.read_shader('vertex_utils') + 
            // v.replace('#include <project_vertex>', this.read_shader( 'grass_project_vertex' ))
            // this.fragmentShader =  this.read_shader('fragment_uniforms') +
            // f.replace('#include <dithering_fragment>',this.read_shader('dithering_fragment'))
            shaders.vertex = this.read_shader('transpose') + this.read_shader('apply_wind') + this.read_shader('g_vertex')
            shaders.fragment = this.read_shader('g_fragment')
            break
    }

    return shaders
  } 

  read_shader = name => document.getElementById(name).textContent
}

let creatLight = (props) =>
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
        // this.lights.add(_l);
        return _l;
}

let get_square_vertices = (height, width, levels) =>
{
    let vertices = []
    let h = height / levels
    let w = width / 2
    for(let level = 0; level < levels; level++)
    {
        let p1 = [-.5 * w, level*h], p2 = [-.5 * w, (1 + level) * h],
        p3 = [.5 * w, level*h], p4 = [.5 * w, (1 + level) * h]
        let points = [
            p1, p2, ,p3,
            p2, p3, p4
        ]
        // w=1
        points.forEach(p => vertices.push( p[0], p[1], 0 ))
        if(level == levels - 1)
        {
            vertices.push(p2[0], p2[1], 0)
            vertices.push(p4[0], p4[1], 0)
            vertices.push((p4[0] + p2[0])/2, p4[1] + 1, 0)
        }
    }
    return vertices
}
let createObject = (context, props) =>
{
    let { type, name,
            shader_type =SHADER_TYPES.DEFAULT,
            position = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = [10, 10, 10],
            color = 0xaaabaa,
            castShadow = true,
            receiveShadow = true,
            shininess,
            setDepthMaterial = false,
            shaderUniforms=
            {
                enableWind: {value: 0},
                windSpeed: {value: context.windSpeed}
            }
        } = props;

    let param1 = scale[0]?scale[0]:null,
        param2 = scale[1]?scale[1]:null,
        param3 = scale[2]?scale[2]:null;
        param4 = scale[3]?scale[3]:null;
        
    let geom = null, geomType = null
    switch(type)
    {
        case "cube":
            geomType = THREE.BoxGeometry; break
        case "cylinder":
            geomType = THREE.CylinderGeometry; break
        case "tetrahedron":
            geomType = THREE.TetrahedronBufferGeometry; break
        case "cone":
            geomType = THREE.ConeGeometry; break
    }

    if(param4)
        geom = new geomType(param1, param2, param3, param4)
    else if(param3)
        geom = new geomType(param1, param2, param3)
    else geom = new geomType(param1, param2)

    shaderUniforms = {
        ...shaderUniforms,
        color: {value: new THREE.Color(color)}
    }
    let material = context.material_maker.make(shaderUniforms, shader_type)
    material.color = new THREE.Color(color)
    if(shininess) material.shininess = shininess;

    let mesh = new THREE.Mesh(geom, material);
        
    if(name) mesh.name = name;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
}

let makeTree = (context, props) =>
{
    let { position, rotation=[0, 0, 0], scale=[1, 1, 1] } = props;
    let { unit } = context
    let rnd_min = (n) =>  n + (1-n) * Math.random()

    let tree = new THREE.Object3D();
    tree.name = "tree"
    let h = (.5 + rnd_min(.2) * scale[1]) * unit
    let trunkPos;
    trunkPos = [...position]
    // h *= 1+ (Math.random()-.5)
    trunkPos[1] += h/2

    let topRad = rnd_min(.4) * unit/5;
    let bottomRad = rnd_min(.4) * unit/5;
    let trunkColor = new THREE.Color(0x956f23)// + (0x0101000 * (Math.random() - .5)))
    trunkColor.r*=rnd_min(1.2)
    trunkColor.g*=rnd_min(1.2)
    trunkColor.b*=rnd_min(1.2)
    trunkColor = trunkColor.getHex()
    tree.add( createObject( context, 
        {
            name: 'Trunk',
            type: 'cylinder',
            position: trunkPos, scale: [topRad, bottomRad, h],
            color: trunkColor, rotation,
            shaderUniforms:
            {
                enableWind: {value: 1},
                windSpeed: {value: context.windSpeed},
                softness: {value: .7}
            }
        }
        ))
    
    let leavesScale;
    let times = Math.ceil(15 * Math.random());

    let leavesColor = new THREE.Color(0x00111 + (0x7bd85d + 0x111111 * .015*(Math.random() - .5)))
    leavesColor.r*=0.3
    leavesColor.b*=0.3
    leavesColor = leavesColor.getHex()
    let leaves_r = [0, 0, 0]
    for(let i=0; i < times; i++)
    {
        let factor = i / times
        leavesScale = [
            rnd_min(.8) * scale[0] * h * .7,
            rnd_min(.8) * scale[1] * h * .7,
            rnd_min(.8) * scale[2] * h * .7
        ];
        let p = [...position]
        p[1] += h
        if(i > 1)
        {
            let rad = unit/3
            let vec = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5)
            vec = vec.normalize()
            vec = vec.multiplyScalar(rad)
            
            p[0] += vec.x
            p[1] += Math.abs(vec.y)
            p[2] += vec.z
            leaves_r = [Math.random()/2 - .25,Math.random()/2 - .25,Math.random()/2 - .25]
            leavesScale[0] *= factor
            leavesScale[1] *= factor
            leavesScale[2] *= factor
        }
        tree.add( createObject( context, 
            {
                name: 'Leaves',
                type: 'cube',
                position: p, scale: leavesScale,
                rotation: leaves_r,
                color:leavesColor,
                shaderUniforms:
                {
                    enableWind: {value: 1},
                    windSpeed: {value: context.windSpeed},
                    height: {value: leavesScale[1]},
                    softness: {value: .7}
                }
            })
        )
    }
    
    return tree;
}

let makeGrass = (context, props) =>
{
    let { position } = props;
    let times = Math.ceil(Math.random() * 7);
    let grass = new THREE.Object3D()
    grass.name = "grass"
    for(let i=0; i < times; i++)
    {
        let p = [...position]
        let rad = context.unit/2
        let c = new THREE.Color(0x5dc636)
        c.r *= 0.1
        c.g -= Math.random()*.125
        c.b *= 0.2
        let h = context.unit * (.05 + .5 * Math.random())
        let w = context.unit * (.03 + .12 * Math.random())
        const vertices = get_square_vertices(h, w, Math.ceil(2 + 3 * Math.random()))
        const positions = [];
        const colors = [];
        const model_nums = []
        
        let vec = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5)
        vec = vec.normalize()
        vec = vec.multiplyScalar(rad)
        for(let t=0;t<vertices.length/3;t++)
        {
            positions.push(p[0] + vec.x, p[1], p[2] + vec.y);
            colors.push( c.r, c.g, c.b, 1 );
            model_nums.push(i)
        }

        const geometry = new THREE.InstancedBufferGeometry();
        geometry.instanceCount = times; // set so its initalized for dat.GUI, will be set in first draw otherwise

        geometry.setAttribute( 'vertex', new THREE.Float32BufferAttribute( vertices, 3 ) );

        geometry.setAttribute( 'position', new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 ) );
        geometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );
        geometry.setAttribute( 'model_num', new THREE.InstancedBufferAttribute( new Float32Array( model_nums ), 1 ) );
        let shaderUniforms =
        {
            enableWind: {value: 0},
            windSpeed: {value: context.windSpeed}
        }
        let material = context.material_maker.make(shaderUniforms, SHADER_TYPES.GRASS)
        
        let mesh = new THREE.Mesh( geometry, material );
        mesh.castShadow = true
        grass.add(mesh)
    }
  
  return grass;
}

let makeRock = (context, props) =>
{
    let { position } = props;
    let rnd = () =>  Math.random() * 180
    let times = Math.ceil(Math.random() * 3);
    let rocks = new THREE.Object3D()
    rocks.name = "rocks"
    for(let i=0; i < times; i++)
    {
        let s = [
            (1 + Math.random() * context.unit/5),
            (1 + Math.floor(Math.random() * context.unit/4))
        ]
        let r = [rnd(),rnd(),rnd()]

        let p = [...position]
        let rad = context.unit/5
        let vec = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5)
        vec = vec.normalize()
        vec = vec.multiplyScalar(rad)
        
        p[0] += vec.x
        p[1] += Math.abs(vec.y)/2
        p[2] += vec.z
        rocks.add( createObject( context, 
        {
            name: 'Rock',
            type: 'tetrahedron',
            position: p, scale: s, rotation: r,
            color: 0xbbba96,
          
        }))
    }
  
  return rocks;
}

let makeWater = (context, props) =>
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
                    windSpeed: {value: context.windSpeed},
                }
            }
            ))
    
    return water;
}

let makeGround = (context, props) =>
{
    let { position } = props;

    let ground = new THREE.Object3D();
    ground.name = "ground"
    let h = context.unit * (.5 + Math.random())
    let f = () => context.unit *(1 + .5 * Math.random())
    position[1] -= h/2
    let rnd = () => (Math.random() - .5 ) * .2
    let rotation = [rnd(), rnd(), rnd()]
    ground.add( createObject( context, {
            type: "cube",
            scale: [f(), h, f()],
            setDepthMaterial: true,
            color: 0xa5f066,
            castShadow: true,
            position, rotation
        }))
        // this.ground.receiveShadow=true)
    
    return ground;
}

// Scene
class PlatoScene
{
    constructor()
    {
        var scene, camera, renderer;
        var h = window.innerHeight * .99;
        var w = window.innerWidth * .99;
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
        this.shaders = {}

        this.world = new THREE.Object3D()
        this.lights = new THREE.Object3D();
        this.pickableObjects = new THREE.Object3D();
        this.rain = new THREE.Object3D();
        
        this.world.add(this.lights)
        this.world.add(this.rain)
        this.world.add(this.pickableObjects)

        this.scene.add(this.world)

        this.setEventListeners();
        this.updateRender = this.updateRender.bind(this);
        this.unit = 5;
        this.mapSize = 17
        this.worldSize = 150

        this.map = new MapController(this,
        {
            mapSize: this.mapSize,
            worldSize: this.worldSize
        })
        this.windSpeed = .5
        this.material_maker = new MaterialMaker(this)
    }
    

    getCell(position)
    {
        let {x, y} = this.pos2world(position)
        return this.map.data.world[x][y]
    }

    removeCell(cell, soft=false)
    {
        let m = this.map.obj3d[cell.x][cell.y]
        if(m)
        {
            let uuids = m.children.map(c => c.material.uuid)
            uuids.forEach(u => delete this.shaders[u])
            this.pickableObjects.remove(m)
            // this.shaders.remove(m)
        }

        if(!soft)
        {
            m = this.map.gnd3d[cell.x][cell.y]
            if(m)
            {
                let uuids = m.children.map(c => c.material.uuid)
                uuids.forEach(u => delete this.shaders[u])
                this.pickableObjects.remove(m)
                // this.shaders.remove(m)
            }
        }
    }

    pos2world(position)
    {
        return this.map.pos2world(position)
    }

    getMouseInteractions(event)
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
            this.renderer.setSize(window.innerWidth*.98, window.innerHeight*.98);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }

        addEventListener( 'click', e =>
        {             
            let position = this.pointerPad.position
            let obj = this.getCell(position)
            switch(obj)
            {
                case CATALOGUE.GROUND:
                    this.map.drawTree(position)
                    break
                default:
                    let cell = this.pos2world(position)
                    this.removeCell(cell, true)
                    this.map.data.world[cell.x][cell.y] = CATALOGUE.GROUND
                    break
            }

        }, false );  

        addEventListener('mousemove', e =>
        {
            let clamp = v => new THREE.Vector3(
                Math.min(.5, Math.max(-.44, v.x)),
                Math.min(.5, Math.max(-.44, v.y)),
                Math.min(.5, Math.max(-.44, v.z))
            )
            // let intersections = this.getMouseInteractions(e);
            let wp = this.world.position.clone()
            let mouse = new THREE.Vector3(e.pageX / window.innerWidth, 0, e.pageY / window.innerHeight)
            mouse.addScalar(-.5)
            mouse.multiplyScalar(1.5)
            mouse = clamp(mouse)
            mouse.multiplyScalar(this.mapSize)
            let p_light = new THREE.Vector3(mouse.x, 0, mouse.z)
            p_light.multiplyScalar(this.unit)
            wp.multiplyScalar(-1)
            let q = mouse.floor().multiplyScalar(this.unit).add(wp)
            let wpos = this.pos2world(q)
            let h = this.map.data.height[wpos.x][wpos.y]
            this.pointerPad.position.set(q.x, h, q.z)
            p_light.add(wp)
            this.pointerLight.position.set(p_light.x, h + 3, p_light.z);
        });

        addEventListener("keydown", event =>
        {
            let { code } = event

            keysPressed[code] = true;
            let move = {x: 0, y: 0}
            if(keysPressed["ArrowUp"] || keysPressed["KeyW"])
                move.y = -1
            else if(keysPressed["ArrowDown"] || keysPressed["KeyS"])
                move.y = 1
            else if(keysPressed["ArrowLeft"] || keysPressed["KeyA"])
                move.x = -1
            else if(keysPressed["ArrowRight"] || keysPressed["KeyD"])
                move.x = 1
            
            this.map.makeMove(move)
        });

        addEventListener('keyup', event =>
        {
            delete keysPressed[event.code];
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
            color: 0xbb99aa,
            intensity: 1,
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
            color: 0x1023f7,
            intensity: 2,
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
        // this.ground = createObject( this, {
        //     type: "cube",
        //     scale: [this.mapSize * this.unit, this.unit/2, this.mapSize * this.unit],
        //     setDepthMaterial: true,
        //     color: 0xa5f066,
        //     castShadow: true
        // });
        // this.ground.receiveShadow=true
        // this.pickableObjects.add(this.ground);

        let pad = createObject( this, 
            {
                position: [0, 0, 0],
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

        this.updateDayTime(0)
        
        /////////////////////
        // this.drawTree()
    }
    
    get_shader_ids() { return Object.keys(this.shaders) }
    updateWind(w)
    {
        this.windSpeed = w
        let ids = this.get_shader_ids()
        ids.forEach(i =>
        {
            let s = this.shaders[i]
            if(s.uniforms.enableWind.value)
            s.uniforms.windSpeed.value = this.windSpeed
        })
    }
  
    updateDayTime(dayTime)
    {
      this.dayTime = dayTime + Math.PI / 3
      let color1 = new THREE.Color(0x0034ff)
      let color2 = new THREE.Color(0xaaaaaa)
      let param = Math.max(0, Math.sin(this.dayTime))
      let c = color1.lerp(color2, param)
      this.ambient.color.set(new THREE.Color(c))   
      // this.ambient.intensity = .7 + .5 * Math.sin(-t)
      let cl = new THREE.Color(14/156,29/156,84/156)
      let cl2 = new THREE.Color(10/250,20/250,54/220)
      this.renderer.setClearColor(cl2.lerp(cl, Math.sin(this.dayTime))); //0., 216.0/256., 255.0/256.

      this.moon.position.set(
        90 * Math.sin(this.dayTime*.5),
        70  + 50 * Math.sin(this.dayTime*.3),
        90 * Math.cos(this.dayTime*.5)
      )
      this.moon.intensity = .2 + .5*Math.sin(this.dayTime*2)

      let sunRadius = 90
      this.sun.position.set(
        sunRadius * Math.sin(this.dayTime),
        sunRadius * Math.sin(this.dayTime),
        sunRadius * Math.cos(this.dayTime)
      )
    }
  
    updateScene()
    {
        this.time +=.1;// 0.1 * (Date.now() - this.start);
        // let t = -3.14/2
        // this.dayTime = this.time/10
        //if(this.time % .2 < .1)
        //   this.map.makeMove({x: 1, y: 0})
        
        let ids = this.get_shader_ids()
        ids.forEach(i =>
        {
            let s = this.shaders[i]
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
        this.map.generateMap()
        this.initScene();

        document.body.style.backgroundColor = 0x000000
        this.updateRender();
    }
}


let plt = new PlatoScene();

window.onload = function()
{
    var gui = new dat.GUI();
    var dt = {
        dayTime: plt.dayTime,
        windSpeed: plt.windSpeed
    };
    
    // String field
    let env = gui.addFolder("Environment")
    env.add(dt, "dayTime", 0, 2*3.141592654).name("Day Time").onChange(v => plt.updateDayTime(v));
    env.add(dt, "windSpeed", 0, 1).name("Wind Speed").onChange(w => plt.updateWind(w));
    env.open()
};

plt.run();