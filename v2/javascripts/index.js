const game = {
    machines: [],
    entanglements: [],
    inventory: {},
    upgCount: 0,
    machineIdCount: 0,
    lastTick: Date.now()
}

const itemNames = [
    "water",
    "fire",
    "earth",
    "air",
    "aether", // water + fire + earth + air, or steam + lava + sand + ice
    "steam", // water + fire + aether
    "lava", // fire + earth + aether
    "sand", // earth + air + aether
    "ice", // air + water + aether
    "void", // steam + lava + sand + ice
]

tiers = {
    "water": 1,
    "fire": 1,
    "earth": 1,
    "air": 1,
    "aether": 3,
    "steam": 2,
    "lava": 2,
    "sand": 2,
    "ice": 2,
    "void": 4
}

class Recipe {
    // Output always 1
    constructor(inputs, output) {
        this.inputs = inputs
        this.output = output
    }

    format() {
        if (this.output === null) {
            return "None"
        }
        return `${Object.keys(this.inputs).map(x => `${this.inputs[x]} ${x}`).join(", ")} -> 1 ${this.output}`
    }
}

const recipes = [
    new Recipe({}, null),
    new Recipe({"water": 4}, "fire"),
    new Recipe({"fire": 4}, "earth"),
    new Recipe({"earth": 4}, "air"),
    new Recipe({"air": 4}, "water"),
    new Recipe({"water": 10, "fire": 10, "earth": 10, "air": 10}, "aether"),
    new Recipe({"water": 5, "fire": 4, "aether": 1}, "steam"),
    new Recipe({"fire": 4, "earth": 3, "aether": 1}, "lava"),
    new Recipe({"earth": 3, "air": 2, "aether": 1}, "sand"),
    new Recipe({"air": 2, "water": 5, "aether": 1}, "ice"),
    new Recipe({"steam": 5, "aether": 1}, "lava"),
    new Recipe({"lava": 5, "aether": 1}, "sand"),
    new Recipe({"sand": 5, "aether": 1}, "ice"),
    new Recipe({"ice": 5, "aether": 1}, "steam"),
    new Recipe({"steam": 10, "lava": 10, "sand": 10, "ice": 10, "aether": 10}, "void"),
]


function insertItem(inventory, key, count) {
    if (!Object.keys(inventory).includes(key)) {
        Vue.set(inventory, key, 0)
    }
    inventory[key] += count
}


function getEntanglementPairing(item) {
    for (let pair of game.entanglements) {
        if (pair[0] === item) {
            return pair[1]
        }
        if (pair[1] === item) {
            return pair[0]
        }
    }
    return item
}



class Machine {

    static names = [
        "Source",
        "Storage",
        "Extract From Inventory",
        "Transmuter",
        "Reaction Chamber"
    ]

    constructor(type, id) {
        this.type = type
        this.id = id
        this.outputRate = 2
        this.on = false

        if (this.type == 1) {
            this.alwaysOn = true
        } else {
            this.alwaysOn = false
        }

        if (this.type == 0 || this.type == 2) {
            this.itemType = this.type == 0 ? "water" : null
            this.inputRate = this.type == 0 ? 1 : 2
        }

        if (this.type == 4) {
            this.recipe = recipes[0]
        }

        if ([1, 3, 4].includes(this.type)) {
            this.inputs = {}
        }

        if ([0, 2, 3, 4].includes(this.type)) {
            this.isPushing = false
            this.targetOutput = -1
            this.outputs = {}
        }
    }

    run(dt) {
        // If pushing is on, extract item
        if (this.isPushing === true) {
            if (game.machines.filter(m => m.inputs !== undefined).map(x => x.id).includes(this.targetOutput)) {
                let machine = game.machines.filter(m => m.id === this.targetOutput)[0]
                // There should be only a single output slot, but I'm too lazy to include checks for that
                for (let key of Object.keys(this.outputs)) {
                    const maxExtractable = Math.min(this.outputs[key], dt * this.outputRate * (2 ** game.upgCount))
                    insertItem(machine.inputs, key, maxExtractable)
                    this.outputs[key] -= maxExtractable
                    if (this.outputs[key] == 0) {
                        delete this.outputs[key]
                    }
                }
            }
        }

        if (this.on === false && !this.alwaysOn) return
        
        // Produce stuff
        let outputKeys = Object.keys(this.outputs || {})

        switch (this.type) {
            case 0:
                insertItem(this.outputs, this.itemType, dt * this.inputRate * (2 ** game.upgCount))
                break
            case 1:
                for (let key of Object.keys(this.inputs)) {
                    insertItem(game.inventory, key, this.inputs[key])
                }
                for (let key of Object.keys(this.inputs)) {
                    delete this.inputs[key]
                }
                break
            case 2:
                if (outputKeys.length >= 1 && !outputKeys.includes(this.itemType)) {
                    break
                }
                if (Object.keys(game.inventory).includes(this.itemType)) {
                    const maxExtractable = Math.min(game.inventory[this.itemType], dt * this.inputRate * (2 ** game.upgCount))
                    insertItem(this.outputs, this.itemType, maxExtractable)
                    game.inventory[this.itemType] -= maxExtractable
                }
                break
            case 3:
                const itemKeys = Object.keys(this.inputs).filter(k => this.inputs[k] >= 2)
                if (itemKeys.length <= 0) return
                for (let key of itemKeys) {
                    const entangledItem = getEntanglementPairing(key)
                    if (entangledItem !== key) {
                        if (outputKeys.length >= 1 && !outputKeys.includes(entangledItem)) {
                            continue
                        }
                        insertItem(this.outputs, entangledItem, 1)
                        this.inputs[key] -= 2
                        break
                    }
                }
                break
            case 4:
                // Placeholder recipe
                if (this.recipe.output === null) {
                    break
                }
                if (outputKeys.length >= 1 && !outputKeys.includes(this.recipe.output)) {
                    break
                }
                let ok = true
                for (let key of Object.keys(this.recipe.inputs)) {
                    if ((this.inputs[key] || 0) < this.recipe.inputs[key]) {
                        ok = false
                        break
                    }
                }
                if (ok) {
                    for (let key of Object.keys(this.recipe.inputs)) {
                        this.inputs[key] -= this.recipe.inputs[key]
                    }
                    insertItem(this.outputs, this.recipe.output, 1)
                }
                break
            default:
        }
    }

    voidContent() {
        if (this.inputs !== undefined) {
            this.inputs = {}
        }
        if (this.outputs !== undefined) {
            this.outputs = {}
        }
    }

}

const app = new Vue({
    el: "#app",
    data: {
        game,
        machines: Machine.names,
        recipes,
        itemNames,
        selectElements: [null, null]
    },
    computed: {
        selectableElement() {
            const playerElements = game.entanglements.flat()
            return this.itemNames.filter(x => !playerElements.includes(x))
        }
    },
    methods: {
        makeMachine(i) {
            this.game.machines.push(new Machine(i, this.game.machineIdCount))
            this.game.machineIdCount ++
        },
        deleteMachine(mac) {
            this.game.machines = this.game.machines.filter(m => m !== mac)
        },
        entangle() {
            const [a, b] = this.selectElements
            if (a === b) return
            if (!this.selectableElement.includes(a) || !this.selectableElement.includes(b)) return
            if ((this.game.inventory[a] || 0) < 1 || (this.game.inventory[b] || 0) < 1) return 
            this.game.inventory[a] -= 1
            this.game.inventory[b] -= 1
            this.game.entanglements.push([a, b])
            this.selectElements = [null, null]
        },
        unentangle(item) {
            const [a, b] = item
            if ((this.game.inventory[a] || 0) < 10 || (this.game.inventory[b] || 0) < 10) return 
            this.game.inventory[a] -= 10
            this.game.inventory[b] -= 10
            this.game.entanglements = this.game.entanglements.filter(x => x !== item)
        }
    },
    mounted() {
        setInterval(tick, 50)
    }
})

function tick() {
    const currentTick = Date.now()
    dt = (currentTick - game.lastTick) / 1000 // The unit is seconds

    for (let machine of game.machines) {
        machine.run(dt)
    }

    game.lastTick = Date.now()
}

