import { UserManager } from './UserManager';
import { ActionModificationCanvas } from './ActionModificationCanvas';
import { getCanvas } from "./main";
import { Share } from "./share";
import { Layout } from './Layout';
import { CancelStack } from './cancelStack';
import { Action } from './Action';

/**
 * Manage the board
 */
export class BoardManager {


    /** name of the board. Default is 0 (this name is used for storing in localStorage) */
    static boardName = "0";

    /** stack to store the cancel/redo actions */
    static cancelStack = new CancelStack();


    /**
   * initialization (button)
   */
    static init(): void {
        document.getElementById("blackboardClear").onclick = () => {
            Share.execute("boardClear", []);
        }

    }


    /**
    * erase the board
    */
    static _clear(): void {
        const canvas = getCanvas();
        canvas.width = canvas.width + 0; //clear
        BoardManager.cancelStack.clear();
    }






    /**
     * @param a rectangle r 
     * @returns a canvas of width r.x2 - r.x1 and height r.y2 - r.y1 containing the content of the canvas
     */
    static _createCanvasForRectangle(r: { x1: number, y1: number, x2: number, y2: number }): HTMLCanvasElement {
        const C = document.createElement("canvas");
        C.width = r.x2 - r.x1;
        C.height = r.y2 - r.y1;
        const ctx = C.getContext("2d");
        ctx.drawImage(getCanvas(),
            r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1, //coordinates in the canvas
            0, 0, r.x2 - r.x1, r.y2 - r.y1); //coordinates in the magnet
        return C;
    }


    /**
     *
     * @param {*} r a rectangle {x1, y1, x2, y2}
     * @description call the callback when the blob of the rectangle is created
     */
    static _toBlobOfRectangle(r: { x1: number, y1: number, x2: number, y2: number }, callback: BlobCallback): void {
        BoardManager._createCanvasForRectangle(r).toBlob(callback);
    }



    /**
  *
  * @param {*} r a rectangle {x1, y1, x2, y2}
  * @returns the content as a string of the image
  */
    static getDataURLOfRectangle(r: { x1: number, y1: number, x2: number, y2: number }): string {
        return BoardManager._createCanvasForRectangle(r).toDataURL();
    }



    /**
     * save the current board into the cancel/redo stack but also in the localStorage of the browser
     */
    static save(rectangle: { x1: number, y1: number, x2: number, y2: number } | undefined): void {
        const canvas = getCanvas();
        canvas.toBlob((blob) => {
            console.log("save that blob: " + blob)
            //  localStorage.setItem(Share.getTableauNoirID(), canvas.toDataURL());
            //rectangle = { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height };
            BoardManager.cancelStack.push(new ActionModificationCanvas(UserManager.me.userID, blob, rectangle)); // a correct userid should be given
            //Share.sendFullCanvas(blob);
        });

    }

    static saveFullScreen(): void {
        const canvas = getCanvas();
        BoardManager.save({ x1: 0, y1: 0, x2: canvas.width, y2: canvas.height });
    }


    static addAction(action: Action): void {
        BoardManager.cancelStack.push(action);
    }




    static getCurrentScreenRectangle(): { x1: number, y1: number, x2: number, y2: number } {
        const container = document.getElementById("container");
        const x1 = container.scrollLeft;
        const y1 = container.scrollTop;
        const x2 = x1 + Layout.getWindowWidth();
        const y2 = y1 + Layout.getWindowHeight();
        return { x1: x1, y1: y1, x2: x2, y2: y2 };
    }

    static saveCurrentScreen(): void {
        BoardManager.save({ x1: Layout.getWindowLeft(), y1: 0, x2: Layout.getWindowRight(), y2: Layout.getWindowHeight() });
    }

    /**
     * load the board from the local storage
     */
    static load(data = localStorage.getItem(Share.getTableauNoirID())): void {
        // let data = localStorage.getItem(BoardManager.boardName);

        if (data != undefined) {
            BoardManager._clear();
            try {
                const image = new Image();
                image.onload = function () {
                    const canvas = getCanvas();
                    canvas.width = image.width;
                    canvas.height = image.height;
                    canvas.getContext("2d").drawImage(image, 0, 0);
                    BoardManager.cancelStack.clear();
                    console.log("loaded!")
                }
                image.src = data;
            }
            catch (e) {
                //TODO: handle error?
            }

        }
        else {
            BoardManager._clear();
        }

    }




    /**
     *
     */
    static async cancel(userid: string): Promise<void> {
        if (!BoardManager.cancelStack.canUndo(userid))
            return;

        await BoardManager.cancelStack.undo(userid);
    }



    /**
     *
     */
    static async redo(userid: string): Promise<void> {
        if (!BoardManager.cancelStack.canRedo(userid))
            return;

        await BoardManager.cancelStack.redo(userid);
    }
}
