import './style.css';
import { Canvas } from 'webgl-operate';
import { setupFullscreen } from './fullscreen';
import { Renderer } from './renderer';

const htmlCanvas = document.getElementById('canvas') as HTMLCanvasElement;

setupFullscreen(htmlCanvas);

const options: WebGLContextAttributes = {
    antialias: false,
    alpha: false
};
const canvas = new Canvas(htmlCanvas, options);
const renderer = new Renderer();
canvas.renderer = renderer;
