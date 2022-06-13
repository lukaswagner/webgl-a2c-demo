import {
    Buffer,
    ChangeLookup,
    Context,
    Initializable,
} from 'webgl-operate';

export class Geometry extends Initializable {
    protected _uv = new Uint8Array([+1, -1, +1, +1, -1, -1, -1, +1]);
    protected _pos : Float32Array;

    protected _uvLocation: GLuint = 0;
    protected _posLocation: GLuint = 1;

    protected _gl: WebGL2RenderingContext;
    protected _object: WebGLVertexArrayObject;
    protected _buffers = new Array<Buffer>();

    public constructor(context: Context) {
        super();

        this._gl = context.gl as WebGL2RenderingContext;
        this._object = this._gl.createVertexArray();

        this._buffers.push(
            new Buffer(context),
            new Buffer(context)
        );
    }

    @Initializable.initialize()
    public initialize(pos: Float32Array): boolean {
        this._pos = pos;

        let valid = true;
        this._buffers.forEach((b) =>
            valid = b.initialize(this._gl.ARRAY_BUFFER) && valid);

        this._buffers[0].data(this._uv, this._gl.STATIC_DRAW);
        this._buffers[1].data(this._pos, this._gl.STATIC_DRAW);

        return valid;
    }

    public uninitialize(): void {
    }

    public draw(): void {
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLE_STRIP, 0,
            this._uv.length / 2, this._pos.length / 3);
    }

    public bind(): void {
        this._gl.bindVertexArray(this._object);
        this._buffers[0].attribEnable(
            this._uvLocation, 2, this._gl.BYTE, false, 0, 0, true, false);
        this._gl.vertexAttribDivisor(this._uvLocation, 0);
        
        this._buffers[1].attribEnable(
            this._posLocation, 3, this._gl.FLOAT, false, 0, 0, true, false);
        this._gl.vertexAttribDivisor(this._posLocation, 1);
    }

    public unbind(): void {
        this._buffers[0].attribDisable(this._uvLocation, true, true);
        this._buffers[1].attribDisable(this._posLocation, true, true);
        this._gl.bindVertexArray(undefined);
    }
}
