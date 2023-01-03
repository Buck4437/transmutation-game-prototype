// eslint-disable-next-line no-new

function makeMachine(type, r, c) {
    return new Machine(type, [r, c])
}

function hash(listNumbers) {
    return listNumbers.join(", ")
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
    return zip(v1, v2).map(arr => arr.reduce((a, b) => a + b, 0))
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
        vec: [-1, 0],
        value: 0
    },
    1: {
        name: "Right",
        vec: [0, 1],
        value: 1
    },
    2: {
        name: "Down",
        vec: [1, 0],
        value: 2
    },
    3: {
        name: "Left",
        vec: [0, -1],
        value: 3
    }
}

function getMachineAt(r, c) {
    if (r < 0 || r > 9 || c < 0 || c > 9) {
        return null
    }
    return game.grid[r][c]
}

function insertItem(inventory, name, count, max = -1) {
    if (!Object.keys(inventory).includes(name)) {
        Vue.set(inventory, name, 0)
    }
    const maxInsertable = (max >= 0 ? Math.min(count, max - inventory[name]) : count)
    inventory[name] += maxInsertable
    return maxInsertable
}

function extractItem(inventory, name, count) {
    if (!Object.keys(inventory).includes(name)) {
        return 0;
    }
    const maxExtractable = Math.min(inventory[name], count)
    if (maxExtractable == count) {
        delete inventory[name]
    } else {
        inventory[name] -= maxExtractable
    }
    return maxExtractable
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

    constructor(type, coord) {
        this.type = type
        this.coord = coord
        this.inputs = {}
        this.outputs = {}
        this.inputItem = (type === Machine.TYPE.EXTRACTOR ? "water" : null)
        this.inputRate = 1
        this.outputRate = 1
        this.inputMaxSlot = 1
        this.pushDirection = DIRECTIONS.UP
        this.inputMax = 10
        this.outputMax = 10
        this.isPushing = false
    }

    canExtract() {
        return [
            Machine.TYPE.INPUT,
            Machine.TYPE.TRANSMUTER,
            Machine.TYPE.EXTRACTOR
        ].includes(this.type)
    }

    canInsert(type) {
        if ([
            Machine.TYPE.OUTPUT,
            Machine.TYPE.TRANSMUTER
        ].includes(this.type)) {
            if (Object.keys(this.inputs) < this.inputMaxSlot) {
                return true
            }
            if (Object.keys(this.inputs).includes(type)) {
                if (this.inputs[type] < this.inputMax) {
                    return true
                }
            }
        }
        return false
    }

    generateStuff(dt) {
        // Try to push output liquid to the neighbouring machine
        const neighbour = getMachineAt(...vec_add(this.coord, DIRECTIONS_INFO[this.pushDirection].vec))

        if (this.canExtract() && this.isPushing) {
            if (neighbour !== null) {
                for (let key of Object.keys(this.outputs)) {
                    if (neighbour.canInsert(key)) {
                        const maxExtractable = extractItem(this.outputs, key, this.outputRate * dt)
                        const maxInserted = insertItem(neighbour.inputs, key, maxExtractable, neighbour.inputMax)
                        if (maxInserted !== maxExtractable) {
                            insertItem(this.outputs, key, maxExtractable - maxInserted)
                        }
                        break;
                    }
                }
            }
        }
        
        if (this.type === Machine.TYPE.EXTRACTOR) {
            if (this.inputItem != null) {
                const itemCount = this.inputRate * dt
                insertItem(this.outputs, this.inputItem, itemCount, this.outputMax)
            }
        } else if (this.type === Machine.TYPE.INPUT) {

        } else if (this.type === Machine.TYPE.OUTPUT) {
            console.log("dold")
            for (let key of Object.keys(this.inputs)) {
                insertItem(game.inventory, key, this.inputs[key])
                extractItem(this.inputs, key, this.inputs[key])
            }
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
            newRow[c] = makeMachine(type, r, c)
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