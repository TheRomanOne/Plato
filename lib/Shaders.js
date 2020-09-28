class ShaderMaker
{
  constructor(props)
  {
    let {shader} = props
    this.shader = shader

    this.vertexShader =  `
          uniform float time;
          uniform float windSpeed;
          uniform int enableWind;
          uniform float height;
          varying vec4 pos;
          ` + this.shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          if(enableWind>0)
          {
              float v = transformed.y + 5.;
              vec3 worldPos = (modelMatrix * vec4( transformed, 1.0 )).xyz;

              if(transformed.y > 0.)
              {
                float ang = worldPos.y + worldPos.x+worldPos.z/2.;
                float amp = .09 * worldPos.y;
                float speed = time + sin(ang/10.)*cos(ang+time);
                speed*=windSpeed;
                // speed*=.5;
                transformed.x += amp*sin(ang/10. + speed);
                transformed.z += amp*cos(ang/10. + speed);
              }
          }
        `);

    this.fragmentShader =  `
        uniform float time;
        uniform vec3 size;
        uniform vec3 color;
        ` + this.shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
          #include <dithering_fragment>
          vec3 c = gl_FragColor.xyz * color;
          
          gl_FragColor = vec4(c, 1);
        `
        );

      this.shadowVertex = `
      // uniform float time;

      void main() {

        // float v = transformed.y + 5.;
        // vec3 worldPos = (modelMatrix * vec4( transformed, 1.0 )).xyz;
        // vec3 gl_Pos = transformed.xyz;
        // if(transformed.y > 0.)
        // {
        //   float ang = worldPos.y + worldPos.x+worldPos.z/2.;
        //   float amp = .09 * worldPos.y;
        //   float speed = time + sin(ang/10.)*cos(ang+time);
        //   speed*=.5;
        //   gl_Pos.x += amp*sin(ang/10. + speed);
        //   gl_Pos.z += amp*cos(ang/10. + speed);
        // }
        vec4 worldPos = (modelMatrix * vec4( position, 1.0 ));
        gl_Position = projectionMatrix * viewMatrix * worldPos;

      }

      `
  }

  
}

export { ShaderMaker }