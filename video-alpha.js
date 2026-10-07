/** Display an H.264 frame with color on the left and its alpha mask on the right.
 * Packing both halves into one video keeps them synchronized and avoids
 * browser-specific transparent-video codecs. The canvas is premultiplied.
 */
export function createAlphaVideo(canvas, video) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: true, antialias: false,
    depth: false, stencil: false, powerPreference: 'low-power',
  });
  if (!gl) throw new Error('Transparent video requires WebGL');
  const shaders = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  function shader(type, source) {
    const result = gl.createShader(type);
    shaders.push(result);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    gl.attachShader(program, result);
  }
  function dispose() {
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach(item => gl.deleteShader(item));
  }
  try {
    shader(gl.VERTEX_SHADER, `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);
    shader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D frame;
      varying vec2 uv;
      void main() {
        vec3 color = texture2D(frame, vec2(uv.x * 0.5, uv.y)).rgb;
        float alpha = smoothstep(0.01, 0.99, texture2D(frame, vec2(0.5 + uv.x * 0.5, uv.y)).r);
        gl_FragColor = vec4(color * alpha, alpha);
      }
    `);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'frame'), 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    draw() {
      if (gl.isContextLost()) throw new Error('Video canvas context lost');
      if (video.readyState < 2) return false;
      if (video.videoWidth !== canvas.width * 2 || video.videoHeight !== canvas.height) {
        throw new Error('Video dimensions do not match the packed-alpha canvas');
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return true;
    },
    dispose,
  };
}
