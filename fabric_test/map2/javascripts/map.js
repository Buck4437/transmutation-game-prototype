// Dummy data, this is to test if it is possible to create a scrollable map.
// All data is in the form of left, top (column, row / x, y) to be in line with html's display
CANVAS_OFFSET = 1000000
OBJECT_DATA = [
];

for (let i = 0; i < 5; i ++) {
    OBJECT_DATA.push({
        left: i * 200,
        top: i * 200
    })
}

const canvas = new fabric.Canvas('main-canvas');

function init() {
    
    canvas.selection = false;

    let vpt = canvas.viewportTransform
    vpt[4] -= CANVAS_OFFSET
    vpt[5] -= CANVAS_OFFSET

    canvas_objects = [];
    for (let data of OBJECT_DATA) {
        let object = new fabric.Rect({
            left: data.left + CANVAS_OFFSET,
            top: data.top + CANVAS_OFFSET,
            fill: 'red',
            width: 20,
            height: 20,
            selectable: false
        });
        canvas.add(object);
        canvas_objects.push(
            {
                position: data,
                element: object
            }
        );
        
    }
    canvas.requestRenderAll();
}

init()

canvas.on('mouse:down', function(opt) {
    const evt = opt.e;
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
});

canvas.on('mouse:move', function(opt) {
    if (this.isDragging) {
        const e = opt.e;
        const vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
    }
});

canvas.on('mouse:up', function(opt) {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    this.setViewportTransform(this.viewportTransform);
    this.isDragging = false;
    this.selection = true;
});

