var canvas = new fabric.Canvas('main-canvas');
canvas.selection = false

objects = []

MODE = {
    NONE: -1,
    ADD: 1
}

const machineSelectionBackground = new fabric.Rect({
    left: 0,
    top: 0,
    fill: "black",
    width: 110,
    height: 60,
    selectable: false
})

const machineSelectionButtons = [
    new fabric.Circle({
        left: 10,
        top: 10,
        fill: 'red',
        radius: 20,
        selectable: false
    }),
    new fabric.Circle({
        left: 60,
        top: 10,
        fill: 'green',
        radius: 20,
        selectable: false
    })
]


var machineSelection = new fabric.Group([
        machineSelectionBackground,
        machineSelectionButtons
    ].flat(), 
    {
        left: 100,
        top: 440,
        selectable: false
    }
)

canvas.add(machineSelection)

selectionMode = MODE.NONE

// // event handler when the player clicks on a canvas
// canvas.on('mouse:down', function(options) {
//     console.log(options.e.clientX, options.e.clientY);

//     if (options.target === null) {
//         selectionMode = MODE.ADD
//         previousSelected = {
//             left: options.e.clientX,
//             top: options.e.clientY
//         }
//     }

// });

// canvas.on('mouse:move', function(options) {
//     if (selectionMode == MODE.ADD) {
//         let [x, y] = [options.e.clientX, options.e.clientY]
//         temporaryOffset = {
//             left: x - previousSelected.left,
//             top: y - previousSelected.top
//         }
//         for (let object of machines) {
//             object.element.left = object.position.left + cumulativeOffset.left + temporaryOffset.left
//             object.element.top = object.position.top + cumulativeOffset.top + temporaryOffset.top
//         }
//         updateCanvas()
//     }
// });

// canvas.on('mouse:up', function(options) {
//     selectionMode = MODE.ADD
//     cumulativeOffset.left += temporaryOffset.left
//     cumulativeOffset.top += temporaryOffset.top
//     console.log(2)
// });


function updateCanvas() {
    canvas.renderAll()
}