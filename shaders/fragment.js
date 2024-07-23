export default ` /* GLSL */
#include <fog_pars_fragment>

uniform sampler2D map;
uniform float alphaTest;

void main() {

  gl_FragColor = texture2D(map, gl_PointCoord);

  // Alpha Test
  if (gl_FragColor.a < alphaTest) discard;

  #include <fog_fragment>
}
`;