// eslint-disable-next-line no-new

function makeMachine(type) {
    return new Machine(type)
}

function hash(listNumbers) {
    return numbers.join(", ")
}

function unhash(hash) {
    return hash.split(", ").map(x => parseInt(x))
}

// Added for vector operations
// https://stackoverflow.com/questions/4856717/javascript-equivalent-of-pythons-zip-function
function zip() {
    var args = [].slice.call(arguments);
    var shortest = args.length==0 ? [] : args.reduce(function(a,b){
        return a.length<b.length ? a : b
    });

    return shortest.map(function(_,i){
        return args.map(function(array){return array[i]})
    });
}

function vec_add(v1, v2) {
    return zip(v1, v2).map(arr => arr.reduce(a, b => a + b, 0))
}

game = {
    grid: Array.from(Array(10)).map(_ => Array.from(Array(10)).map(_ => null)),
    inventory: {},
    lastTick: Date.now()
}

const DIRECTIONS = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
}

const DIRECTIONS_INFO = {
    0: {
        name: "Up",
        vec: [0, -1],
        value: 0
    },
    1: {
        name: "Right",
        vec: [1, 0],
        value: 1
    },
    2: {
        name: "Down",
        vec: [0, 1],
        value: 2
    },
    3: {
        name: "Left",
        vec: [-1, 0],
        value: 3
    }
}

function getMachineAt(r, c) {
    if (0 < r || r > 10 || c < 0 || c > 10) {
        return null
    }
    return game.grid[r][c]
}

class Machine {

    static TYPE = {
        EXTRACTOR: 0,
        MERGER: 1,
        TRANSMUTER: 2,
        INPUT: 3,
        OUTPUT: 4
    }

    static text = [
        {
            id: Machine.TYPE.EXTRACTOR,
            name: "Extractor"
        },
        {
            id: Machine.TYPE.TRANSMUTER,
            name: "Transmuter"
        },
        {
            id: Machine.TYPE.INPUT,
            name: "Input"
        },
        {
            id: Machine.TYPE.OUTPUT,
            name: "Output"
        }
    ]

    RECIPES = {
        // Input, Output 
        "1, 1": {
            TRANSMUTER: [
                {
                    input: {water: 1},
                    output: {fire: 0.25}
                },
                {
                    input: {fire: 1},
                    output: {air: 0.25}
                },
                {
                    input: {air: 1},
                    output: {earth: 0.25}
                },
                {
                    input: {earth: 1},
                    output: {water: 0.25}
                },
            ]
        }
    }

    constructor(type) {
        this.type = type
        this.inputs = {}
        this.outputs = {}
        this.inputItem = (type === Machine.TYPE.EXTRACTOR ? "water" : null)
        this.inputRate = 1
        this.outputRate = 1
        this.pushDirection = DIRECTIONS.UP
        this.inputMax = 10
        this.outputMax = 10
    }

    generateStuff(dt) {
        if (this.type === Machine.TYPE.EXTRACTOR) {
            if (this.inputItem != null) {
                const itemCount = this.inputRate * dt
                if (!Object.keys(this.outputs).includes(this.inputItem)) {
                    Vue.set(this.outputs, this.inputItem, 0)
                }
                const maxInsertable = (this.outputMax >= 0 ? Math.min(itemCount, this.outputMax - this.outputs[this.inputItem]) : itemCount)
                this.outputs[this.inputItem] += maxInsertable
            }
        } else if (this.type === Machine.TYPE.INPUT) {

        } else if (this.type === Machine.TYPE.OUTPUT) {
            // const itemCount = extractItem(game.inventory, this.inputItem, this.inputRate * dt)

        } else if (this.type === Machine.TYPE.TRANSMUTER) {
            
        }
    }

    getText() {
        const type = Machine.TYPE
        switch (this.type) {
            case type.TRANSMUTER: return "->"
            case type.EXTRACTOR: return "E"
            case type.INPUT: return "I"
            case type.OUTPUT: return "O"
        }
    }

}

app = new Vue({
    el: "#app",
    data: {
        Machine,
        selectedCell: [-1, -1],
        game,
        DIRECTIONS,
        DIRECTIONS_INFO
    },
    computed: {
        selectedMachine() {
            const [r, c] = this.selectedCell;
            if (r === -1 && c === -1) {
                return null;
            }
            return game.grid[r][c];
        }
    },
    methods: {
        clickButton(r, c) {
            const item = this.game.grid[r][c];
            this.selectedCell = [r, c];

            this.hide(".menu-screen");
            if (item === null) {
                // open machine purchasing screen
                this.unhide(".buy-screen");
            } else {
                // open item ui
                this.unhide(".mac-screen");
            }
        },
        hide(tag) {
            document.querySelectorAll(tag).forEach(el => el.classList.add("hidden"));
        },
        buyMachine(type) {
            const [r, c] = this.selectedCell;

            // Make it reactive
            // https://stackoverflow.com/questions/45644781/update-value-in-multidimensional-array-in-vue
            //make a copy of the row
            const newRow = this.game.grid[r].slice(0)
            // update the value
            newRow[c] = makeMachine(type)
            // update it in the grid
            this.$set(this.game.grid, r, newRow)

            this.clickButton(r, c)
        },
        unhide(tag) {
            document.querySelectorAll(tag).forEach(el => {el.classList.add("hidden"); el.classList.remove("hidden")});
        },
        getAmount(inventory, itemName) {
            if (!Object.keys(inventory).includes(itemName)) {
                return 0;
            }
            return inventory[itemName];
        }
    },
    watch: {
        selectedMachine: {
            deep: true,
            handler: c => {
            }
        }
    },
    mounted() {
        setInterval(tick, 50)
    }
});

function tick() {
    // Unit is in seconds
    const currentTick = Date.now();
    const dt = (currentTick - game.lastTick) / 1000;

    for (let row of game.grid) {
        for (let machine of row) {
            if (machine !== null) {
                machine.generateStuff(dt)
            }
        }
    }

    game.lastTick = currentTick;
}