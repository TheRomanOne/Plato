
import { PlatoScene } from "./lib/PlatoScene";
import * as dat from 'dat.gui';

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
    env.add(dt, "windSpeed", 0, 2).name("Wind Speed").onChange(w => plt.updateWind(w));
    env.open()
};

plt.run();