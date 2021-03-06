import { DrawingSVG } from './DrawingSVG';
import { UserManager } from './UserManager';
import { ActionFreeDraw } from './ActionFreeDraw';
import { User } from './User';
import { ChalkCursor } from './ChalkCursor';
import { BoardManager } from './boardManager';
import { Delineation } from './Delineation';
import { Drawing } from './Drawing';
import { getCanvas } from './main';
import { Tool } from './Tool';

export class ToolDraw extends Tool {

    lastDelineation = new Delineation();
    private action: ActionFreeDraw;
    private svgLines = [];


    constructor(user: User) {
        super(user);
        if (this.user.isCurrentUser) {
            document.getElementById("buttonEraser").hidden = false;
            document.getElementById("buttonChalk").hidden = true;
            this.setToolCursorImage(ChalkCursor.getStyleCursor(this.user.color));
        }
    }


    mousedown(): void {
        this.lastDelineation.reset();
        this.lastDelineation.addPoint({ x: this.x, y: this.y });
        this.svgLines = [];

        this.action = new ActionFreeDraw(this.user.userID);
        this.action.addPoint({ x: this.x, y: this.y, pressure: 0, color: this.user.color });
    }



    static addSVGLine(
        x1: number, y1: number, x2: number, y2: number,
        pressure = 1.0, color: string = UserManager.me.getCurrentColor()): SVGLineElement {

        const svgns = "http://www.w3.org/2000/svg";
        const shape = <SVGLineElement>document.createElementNS(svgns, 'line');

        shape.setAttributeNS(null, 'x1', "" + x1);
        shape.setAttributeNS(null, 'y1', "" + y1);
        shape.setAttributeNS(null, 'x2', "" + (x2));
        shape.setAttributeNS(null, 'y2', "" + (y2));
        shape.setAttributeNS(null, 'stroke', color);
        shape.setAttributeNS(null, 'stroke-width', "" + (Drawing.lineWidth * (1 + 2 * pressure)));
        shape.setAttributeNS(null, 'opacity', "" + (0.9 + 0.1 * pressure));

        
        document.getElementById("svg").appendChild(shape);
        return shape;
    }



    mousemove(evt: PointerEvent): void {
        if (this.isDrawing) {
            const evtX = evt.offsetX;
            const evtY = evt.offsetY;

            if (this.lastDelineation.isDrawing()) {//this guard is because, when a magnet is created the user does not know the drawing stopped.
                this.action.addPoint({ x: evtX, y: evtY, pressure: evt.pressure, color: this.user.color });
               // Drawing.drawLine(getCanvas().getContext("2d"), this.x, this.y, evtX, evtY, evt.pressure, this.user.color);
                this.svgLines.push(ToolDraw.addSVGLine(this.x, this.y, evtX, evtY, evt.pressure, this.user.color));
            }


        }
    }

    mouseup(): void {

        if (this.isDrawing) {
            for (const l of this.svgLines)
                l.remove();
            this.svgLines = [];
            
            
            if (this.action.alreadyDrawnSth)
                this.action.smoothify();

            for (const p of this.action.points) {
                this.lastDelineation.addPoint({ x: p.x, y: p.y });
            }
            this.lastDelineation.finish();

            this.action.redo();
            BoardManager.addAction(this.action);
        }
    }






    updateCursor(): void {
        if (this.user.isCurrentUser) {
            this.setToolCursorImage(ChalkCursor.getStyleCursor(this.user.color));
        }
    }

}