import * as THREE from "three"
import {makeTree} from './Factories/TreeFactory'
import {makeRock} from './Factories/RockFactory'
import {makeWater} from './Factories/WaterFactory'

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
        this.mapData = {
            lim_x: mapSize,
            lim_nx: 0,
            lim_y: mapSize,
            lim_ny: 0,
            center: {x: Math.floor(mapSize/2), y: Math.floor(mapSize/2)}
        }
        this.renderedMap = new Array(worldSize)
        for(let i=0; i < this.renderedMap.length; i++)
        {
            this.renderedMap[i] = new Array(worldSize)
        }
    }

    renderCell(coord, type)
    {
        let i = coord.x
        let j = coord.y

        let h = this.mapSize/2;
        let y = (i - h) * this.context.unit;
        let x = (j - h) * this.context.unit;
        let ofst = this.context.unit/2
        let position = [x + ofst, ofst/2, y + ofst]
        let mesh;
        if(type === 1)
        {
            // trees
            mesh = makeTree(this.context, { position })
        }else if(type === 2)
        {
            // water
            mesh = makeWater(this.context, { position })
        }else if(type === 3)
        {
            // Rocks
            mesh = makeRock(this.context, { position })
        }
        this.renderedMap[i][j] = mesh
        if(mesh) this.context.pickableObjects.add(mesh);
    }

    renderMap(map)
    {
        // console.log(map)
        this.mapData.map = map;
        for(let i = 0; i < map.length; i++)
            for(let j = 0; j < map[i].length; j++)
            {
                this.renderCell({x:i, y:j}, map[i][j])
            }
        
        // console.log("before", this.renderedMap)
    }

    makeMove(dir)
    {
        let x = dir.x;
        let y = dir.y;
        let md = this.mapData

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
        // console.log("after", this.renderedMap)

        this.context.world.position.x -= unit * dir.x;
        this.context.ground.position.x += unit * dir.x;
        
        this.context.world.position.z -= unit * dir.y;
        this.context.ground.position.z += unit * dir.y;
    }

    updateMap(dir)
    {
        let x = dir.x;
        let y = dir.y;
        let md = this.mapData

        // Remove old

        if(x!=0)
        {   
            let ofst = (x<0)?md.lim_x-1:md.lim_nx

            for(let j = md.lim_ny; j < md.lim_y; j++)
            {
                let m = this.renderedMap[j][ofst]
                if(m) this.context.pickableObjects.remove(m)
            }
        }

        if(y!=0)
        {   
            let ofst = (y<0)?md.lim_y-1:md.lim_ny

            for(let j = md.lim_nx; j < md.lim_x; j++)
            {
                let m = this.renderedMap[ofst][j]
                if(m) this.context.pickableObjects.remove(m)
            }
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
                let type = this.mapData.worldMap[j][ofst]
                this.renderCell({x: j, y: ofst}, type)
            }
        }

        if(y!=0)
        {   
            let ofst = (y>0)?md.lim_y-1:md.lim_ny

            for(let j = md.lim_nx; j < md.lim_x; j++)
            {
                let type = this.mapData.worldMap[ofst][j]
                this.renderCell({x: ofst, y: j}, type)
            }
        }
    }

    // API
    addTree(position)
    {
        let {x, y, z} = position;
        let mesh = makeTree(this.context, {position: [x, y, z]})
        
        let h = this.mapSize/2;
        let i = Math.floor(h + x / this.context.unit);
        let j = Math.floor(h + z / this.context.unit);
        // this.mapData.map[j][i] = 1;

        // console.log(this.mapData.map)
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
        // Lake function
        let f = x => -5+x + 5*Math.sin(x/7)
        
        // Iterate over cells
        for(let i = 0; i < wmap.length; i++)
        {
            // Add trees
            for(let j = 0; j < wmap[i].length; j++)
            wmap[i][j] = (Math.floor(Math.random() * 100) < 20)?1:0

            for(let j = 0; j < wmap[i].length; j++)
            wmap[i][j] = (Math.floor(Math.random() * 100) < 10)?3:wmap[i][j]

            // Add water
            let y = new THREE.Vector2(i, Math.ceil(f(i)))
            for(let j=0; j<wmap[i].length; j++)
                if(y.distanceTo(new THREE.Vector2(i, j)) < 3) wmap[i][j] = 2
            
        }

        this.mapData.worldMap = wmap

        let map = new Array(this.mapSize)
        for(let i = 0; i < map.length; i++)
        {
            map[i] = new Array(this.mapSize)
            for(let j = 0; j < map[i].length; j++)
            {
                let loc_x = this.mapData.center.x + i - Math.floor(this.mapSize / 2)
                let loc_y = this.mapData.center.y + j - Math.floor(this.mapSize / 2)
                map[i][j] = wmap[loc_x][loc_y]
            }
        }

        this.mapData.map = map

        this.renderMap(map)
    }
}

export {MapController}