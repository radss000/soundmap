// lib/webgl/renderer.ts
const NODE_FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vPosition;
varying vec3 vColor;
varying float vHighlight;

void main() {
  float r = length(vPosition);
  
  if (r > 1.0) {
    discard;
  }

  // Soft circle
  float alpha = 1.0 - smoothstep(0.8, 1.0, r);
  
  // Glow effect
  float glow = (1.0 - r) * 0.5;
  vec3 color = vColor + glow * vec3(1.0);
  
  // Highlight rim
  if (vHighlight > 0.0 && r > 0.8) {
    color = mix(color, vec3(1.0), (r - 0.8) * 5.0);
  }

  gl_FragColor = vec4(color, alpha);
}
`;

const NODE_VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 center;
attribute float size;
attribute vec3 color;
attribute float highlight;

uniform mat3 transform;
uniform float zoom;

varying vec2 vPosition;
varying vec3 vColor;
varying float vHighlight;

void main() {
  vPosition = position;
  vColor = color;
  vHighlight = highlight;

  vec2 pos = center + position * size * zoom;
  gl_Position = vec4((transform * vec3(pos, 1.0)).xy, 0.0, 1.0);
}
`;

export class WebGLRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private locations: Record<string, number>
  
  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true
    })
    if (!gl) throw new Error('WebGL not supported')
    
    this.gl = gl
    this.program = this.createProgram()
    this.locations = this.getLocations()
    
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  // Shader setup methods...
  private createProgram(): WebGLProgram {
    const vertexShader = this.createShader('vertex', NODE_VERTEX_SHADER)
    const fragmentShader = this.createShader('fragment', NODE_FRAGMENT_SHADER) 
    
    const program = this.gl.createProgram()
    if (!program) throw new Error('Failed to create program')
    
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)
    
    return program
  }

  private createShader(type: 'vertex' | 'fragment', source: string): WebGLShader {
    const shader = this.gl.createShader(
      type === 'vertex' ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER
    )
    if (!shader) throw new Error('Failed to create shader')
    
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    return shader
  }

  // Drawing methods... 
  render(nodes: Node[], transform: Mat3, zoom: number): void {
    const { gl, program, locations } = this
    
    gl.useProgram(program)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    // Update uniforms
    gl.uniformMatrix3fv(locations.transform, false, transform)
    gl.uniform1f(locations.zoom, zoom)
    
    // Draw nodes
    nodes.forEach(node => {
      this.drawNode(node)
    })
  }

  private drawNode(node: Node): void {
    // Node drawing implementation
  }
}