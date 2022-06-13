import {
    Camera,
    Context,
    DefaultFramebuffer,
    EventHandler,
    EventProvider,
    Framebuffer,
    Invalidate,
    Navigation,
    Program,
    Renderbuffer,
    Renderer as BaseRenderer,
    Shader,
    vec3
} from "webgl-operate";
import { Geometry } from "./geometry";

type vec4 = [number, number, number, number];

export class Renderer extends BaseRenderer {
    protected static NUM_POINTS = 100;

    protected _gl: WebGL2RenderingContext;
    protected _multisampleFBO: Framebuffer;
    protected _intermediateFBO: Framebuffer;
    protected _screenFBO: DefaultFramebuffer;
    protected _camera: Camera;
    protected _navigation: Navigation;
    protected _eventHandler: EventHandler;

    protected _geometry: Geometry;
    protected _program: Program;
    protected _uniforms = new Array<() => void>();
    protected _aspect: number;

    protected onInitialize(
        context: Context,
        invalidate: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        this._gl = context.gl;

        this._camera = new Camera([0, 0, 10], [0, 0, 0], [0, 1, 0]);
        this._camera.near = 5;
        this._camera.far = 15;
        this._camera.fovy = 20;
        this._navigation = new Navigation(invalidate, eventProvider);
        this._navigation.camera = this._camera;
        // @ts-expect-error: override default webgl-operate mouse wheel zoom
        this._navigation._wheelZoom = { process: () => { } };

        this.initFBO();
        this.initGeom();
        this.initProgram();

        this._gl.enable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        this._gl.enable(this._gl.DEPTH_TEST);

        return true;
    }

    protected initFBO() {
        // multi sampled fbo for rendering
        const samples = this._gl.getParameter(this._gl.MAX_SAMPLES);
        console.log('# of samples:', samples);

        const msColor = new Renderbuffer(this._context);
        msColor.initialize(1, 1, this._gl.RGB8, samples);
        const msDepth = new Renderbuffer(this._context);
        msDepth.initialize(1, 1, this._gl.DEPTH_COMPONENT24, samples);

        this._multisampleFBO = new Framebuffer(this._context);
        this._multisampleFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, msColor],
            [this._gl.DEPTH_ATTACHMENT, msDepth]
        ]);
        this._multisampleFBO.clearColor([255, 255, 255, 255]);

        // single sampled fbo for blit (can't blit part of MS FBO)
        const ssColor = new Renderbuffer(this._context);
        ssColor.initialize(1, 1, this._gl.RGB8);

        this._intermediateFBO = new Framebuffer(this._context);
        this._intermediateFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, ssColor]
        ]);

        // screen/default fbo
        this._screenFBO = new DefaultFramebuffer(this._context);
        this._screenFBO.initialize();
    }

    protected initGeom() {
        const numComponents = Renderer.NUM_POINTS * 3;
        const pos = new Float32Array(numComponents);
        for(let i = 0; i < numComponents; ++i) {
            pos[i] = Math.random() * 2 - 1;
        }

        this._geometry = new Geometry(this._context);
        this._geometry.initialize(pos);
    }

    protected initProgram() {
        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        vert.initialize(require('./particle.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        frag.initialize(require('./particle.frag'));

        this._program = new Program(this._context);
        this._program.initialize([vert, frag]);

        this._uniforms.push(
            ((loc: WebGLUniformLocation) => this._gl.uniformMatrix4fv(
                loc, false, this._camera.viewProjection))
            .bind(this, this._program.uniform('u_viewProjection')));
        this._uniforms.push(
            ((loc: WebGLUniformLocation) => this._gl.uniform1f(
                loc, this._aspect))
            .bind(this, this._program.uniform('u_aspect')));
    }

    protected onUninitialize(): void {
    }

    protected onDiscarded(): void {
    }

    protected onUpdate(): boolean {
        this._navigation.update();
        return this._altered.any || this._camera.altered;
    }

    protected onPrepare(): void {
        if(this._altered.frameSize) {
            this._multisampleFBO.resize(...this._frameSize);
            this._intermediateFBO.resize(...this._frameSize);
            this._aspect = this._frameSize[1] / this._frameSize[0];
        }
    }

    protected onFrame(): void {
        this._multisampleFBO.bind();
        this._gl.drawBuffers([this._gl.COLOR_ATTACHMENT0]);
        this._gl.viewport(0, 0, ...this._frameSize);
    
        const clearMask = this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT;
        this._multisampleFBO.clear(clearMask, true, false);
        
        // for use with RGBA buffers
        // this._gl.colorMask(true, true, true, false);
        
        this._program.bind();
        this._uniforms.forEach((u) => u());

        this._geometry.bind();
        this._geometry.draw();
        this._geometry.unbind();

        this._program.unbind();
    }

    protected onSwap(): void {
        // blit directly - requires same buffer config (depth, res, alpha)
        this.blit(this._multisampleFBO, this._screenFBO);

        // blit using intermediate buffer
        // the single sampled buffer allows config differences when read
        /*
        this.blit(this._multisampleFBO, this._intermediateFBO);
        this.blit(this._intermediateFBO, this._screenFBO);

        const x = this._frameSize[0] / 2;
        const y = this._frameSize[1] / 2;
        const srcSize = 100;
        const dstSize = 500;
        const srcLoc: vec4 =
            [x - srcSize, y - srcSize, x + srcSize, y + srcSize];
        const dstLoc : vec4 =
            [10, 10, 10 + dstSize, 10 + dstSize];
        this.blit(this._intermediateFBO, this._screenFBO, srcLoc, dstLoc);
        */
    }

    protected blit(
        src: Framebuffer, dst: Framebuffer,
        srcLoc?: vec4, dstLoc?: vec4
    ) {
        if(!srcLoc) srcLoc = [0, 0, ...this._frameSize];
        if(!dstLoc) dstLoc = [0, 0, ...this._frameSize];

        src.bind(this._gl.READ_FRAMEBUFFER);
        this._gl.readBuffer(this._gl.COLOR_ATTACHMENT0);
        dst.bind(this._gl.DRAW_FRAMEBUFFER);
        this._gl.drawBuffers([
            dst === this._screenFBO ? this._gl.BACK : this._gl.COLOR_ATTACHMENT0
        ]);

        this._gl.blitFramebuffer(
            ...srcLoc, ...dstLoc, this._gl.COLOR_BUFFER_BIT, this._gl.NEAREST);

        src.unbind(this._gl.READ_FRAMEBUFFER);
        dst.unbind(this._gl.DRAW_FRAMEBUFFER);
    }
}