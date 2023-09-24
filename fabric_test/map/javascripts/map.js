// Dummy data, this is to test if it is possible to create a scrollable map.
// All data is in the form of left, top (column, row / x, y) to be in line with html's display
OBJECT_DATA = [
  {
    left: 0,
    top: 0
  },
  {
    left: 200,
    top: 200
  },
  {
    left: -200,
    top: -200
  },
  {
    left: 100,
    top: 100
  },
  {
    left: -100,
    top: -100
  }
]

var canvas = new fabric.Canvas('main-canvas');
canvas.selection = false
canvas.objectCaching = false

objects = []

for (let object of OBJECT_DATA) {
  let rect = new fabric.Rect({
    left: object.left,
    top: object.top,
    fill: 'red',
    width: 20,
    height: 20,
    selectable: false
  })
  canvas.add(rect)
  objects.push(
    {
      position: object,
      element: rect
    }
  )
}

cumulativeOffset = {
  left: 0,
  top: 0
}

temporaryOffset = {
  left: 0,
  top: 0
}

previousSelected = {
  left: 0,
  top: 0
}

inSelection = false

// event handler when the player clicks on a canvas
canvas.on('mouse:down', function(options) {
  console.log(options.e.clientX, options.e.clientY);

  if (options.target === null) {
    inSelection = true
    previousSelected = {
      left: options.e.clientX,
      top: options.e.clientY
    }
  }

});

canvas.on('mouse:move', function(options) {
    if (inSelection) {
        let [x, y] = [options.e.clientX, options.e.clientY]
        temporaryOffset = {
            left: (x - previousSelected.left) / canvas.getZoom(),
            top: (y - previousSelected.top) / canvas.getZoom()
        }
        for (let object of objects) {
            object.element.left = object.position.left + cumulativeOffset.left + temporaryOffset.left
            object.element.top = object.position.top + cumulativeOffset.top + temporaryOffset.top

            // cheap solution,
            canvas.remove(object.element)
            canvas.add(object.element)
        }
        console.log(objects.length)
        canvas.renderAll()
    }
});

canvas.on('mouse:up', function(options) {
    console.log(options.e.clientX, options.e.clientY);

    inSelection = false
    cumulativeOffset.left += temporaryOffset.left
    cumulativeOffset.top += temporaryOffset.top
    console.log(2)

    console.log(options.target)
});

canvas.on('mouse:wheel', function(opt) {
    let delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    canvas.setZoom(zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();
})
