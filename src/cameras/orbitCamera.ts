import { Camera } from '../scenes/scene';
import { vec3 } from 'gl-matrix';

export const orbitCamera = (
  gl: WebGLRenderingContext,
  camera: Camera,
  initialRadius: number = 10,
) => {
  let mouseDown = false;
  let r = initialRadius;
  let camPhi = 0;
  let camTetha = 0;

  const { min, max, cos, sin, PI } = Math;
  const updateCamera = () => {
    const camX = r * cos(camPhi) * sin(camTetha);
    const camY = r * sin(camPhi);
    const camZ = r * cos(camTetha) * cos(camPhi);

    vec3.add(camera.position, camera.target, [camX, camY, camZ]);
  };
  updateCamera();

  let currTouch: { x: number, y: number };
  const updateCurrTouch = (touch: Touch) => {
    currTouch = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const onTouch = (e: MouseEvent | TouchEvent) => {
    // MouseEvent
    if ('button' in e) {
      if (e.button === 0) {
        mouseDown = true;
      }
      return;
    }

    // TouchEvent
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      mouseDown = true;
      updateCurrTouch(e.changedTouches[0]);
    }
  };

  const getMovement = (e: MouseEvent | TouchEvent) => {
    const speed = 0.005;
    const touchSpeed = speed * 2;

    // MouseEvent
    if ('movementX' in e && 'movementY' in e) {
      return { x: e.movementX * speed, y: e.movementY * speed };
    }

    // TouchEvent
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];

      const x = -(currTouch.x - touch.clientX) * touchSpeed;
      const y = -(currTouch.y - touch.clientY) * touchSpeed;

      updateCurrTouch(touch);
      return { x, y };
    }
  };

  const onMove = (e: MouseEvent | TouchEvent) => {
    let movement = getMovement(e);

    if (mouseDown) {
      camTetha = (camTetha - movement.x) % (PI * 2);
      camPhi = camPhi + movement.y;

      camPhi = min(max(camPhi, -3.14 / 2), 3.14 / 2);
      camTetha = camTetha < 0 ? PI * 2 - camTetha : camTetha;

      updateCamera();
    }
  };

  const onRelease = (e: MouseEvent | TouchEvent) => {
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      currTouch.x = e.changedTouches[0].clientX;
      currTouch.y = e.changedTouches[0].clientY;
    }
    mouseDown = false;
  };

  const onZoom = (e: WheelEvent) => {
    r += e.deltaY * 0.01;
    r = max(r, 1);
    updateCamera();
  };

  gl.canvas.addEventListener('mousedown', onTouch);
  gl.canvas.addEventListener('touchstart', onTouch);

  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove);

  window.addEventListener('mouseup', onRelease);
  window.addEventListener('touchend', onRelease);

  window.addEventListener('wheel', onZoom);

  return camera;
};

export default orbitCamera;
