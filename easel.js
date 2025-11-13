// This is mostly taken from doodle-rpg.com
// Added: undo tool
// Removed: clear button

class Easel {
    constructor(div) {
        this.div = div
        this.jcanvas = div.find("canvas")
        this.canvas = this.jcanvas[0]
        this.done = div.find(".done")
        this.cancel = div.find(".cancel")
        this.clearBtn = div.find(".clear")
        this.tools = div.find(".tool")
        this.enabled = false
        this.canvas.height = 400
        this.canvas.width = 400
        this._dirty = false
        this.clearBtn.on("click", () => {
            if (this.dirty && !window.confirm("Really delete your drawing?")) return
            this.clear()
        })
        this.tools.on("click", (ev) => {
            if ($(ev.target).hasClass("instant")) {
                if ($(ev.target).hasClass("undo")) this.undo()
                return
            }
            this.toggleTool($(ev.target))
        })
        this.tool = "pencil"
        this.saveStack = []
    }
    mouse(ev) {
        const rect = this.canvas.getBoundingClientRect()
        return { x: (ev.clientX - rect.left)/rect.width*this.canvas.width, y: (ev.clientY - rect.top)/rect.height*this.canvas.height }
    }
    line(mouse1, mouse2) {
        // assumes mouse (pixel) and canvas coordinates are the same, which they are here.
        this.dirty = true
        const c = this.canvas.getContext("2d")
        const tool = {
            pencil: {
                lineWidth: 5,
                strokeStyle: "#000000",
                lineCap: "round",
                globalCompositeOperation: "destination-over",
            },
            eraser: {
                lineWidth: 10,
                strokeStyle: "#ffffff",
                lineCap: "round",
                globalCompositeOperation: "destination-out",
            }
        }[this.tool]
        for (let [k, v] of Object.entries(tool)) c[k] = v
        c.lineWidth *= this.thicknessMultiplier
        c.beginPath()
        c.moveTo(mouse1.x, mouse1.y)
        c.lineTo(mouse2.x, mouse2.y)
        c.stroke()
    }
    toggleTool(toolElement) {
        this.tool = toolElement.data("tool")
        this.tools.removeClass("tool-selected")
        toolElement.addClass("tool-selected")
    }
    clear() {
        const c = this.canvas.getContext("2d")
        c.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.dirty = false
        this.saveStack = []
    }
    replaceArt(dataUrl) {
        const c = this.canvas.getContext("2d")
        c.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.loadArt(dataUrl)
    }
    loadArt(dataUrl) {
        const c = this.canvas.getContext("2d")
        this.dirty = true
        return new Promise(done => {
            const imageObj = new Image()
            imageObj.onload = () => {
                c.drawImage(imageObj, 0, 0, this.canvas.width, this.canvas.height)
                done()
            }
            imageObj.src = dataUrl
        })
    }
    get dirty() { return this._dirty }
    set dirty(v) {
        this._dirty = v
        this.cancel.toggleClass("hidden", v)
        this.clearBtn.toggleClass("hidden", !v)
    }
    enable() {
        this.div.toggleClass("enabled", true)
        scroll() // Why doesn't it scroll to include the buttons after, on chrome's test mobile?
        // Allow drawing
        const engage = ev => {
            this.savepoint()
            let mouse = this.mouse(ev)
            this.line(mouse,mouse)
            const move = ev => {
                ev.preventDefault()
                ev.stopPropagation()
                const newMouse = this.mouse(ev)
                this.line(mouse, newMouse)
                mouse = newMouse
            }
            const disengage = ev => {
                this.jcanvas.off("mousemove")
                this.jcanvas.off("touchmove")
                $(document).off("mouseup")
                $(document).off("touchend")
                const finalMouse = this.mouse(ev)
                this.line(mouse, finalMouse)
            }
            this.jcanvas.on("mousemove", move)
            this.jcanvas.on("touchmove", ev => {
                const touch = ev.touches[0]
                ev.preventDefault()
                ev.stopPropagation()
                var mouseEvent = new MouseEvent("mousemove", {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                })
                this.jcanvas[0].dispatchEvent(mouseEvent)
            })
            $(document).on("mouseup", disengage)
            $(document).on("touchend", disengage)
        }
        this.jcanvas.on("mousedown", engage)
        this.jcanvas.on("touchstart", ev => engage(ev.touches[0]))
    }
    disable() {
        this.div.toggleClass("enabled", false)
        this.jcanvas.off("mousedown")
        $(document).off("mouseup")
        this.jcanvas.off("mousemove")
    }
    undo() {
        if (this.saveStack.length == 0) return
        const data = this.saveStack.pop()
        this.replaceArt(data)
    }
    savepoint() {
        this.saveStack.push(this.getData())
    }
    draw(thicknessMultiplier, oldArt) {
        this.thicknessMultiplier = thicknessMultiplier || 1
        return new Promise((done) => {
            this.clear()
            if (oldArt) this.loadArt(oldArt).then(this.enable.bind(this))
            else this.enable()
            
            this.done.on("click", () => {
                this.done.off("click")
                this.cancel.off("click")
                this.disable()
                const data = this.canvas.toDataURL()
                done(data)
            })
        })
    }

    isEmpty() {
        const ctx = this.canvas.getContext('2d')
        const pixelData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data
        for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] !== 0) return false
        }
        return true
    }

    getData() {
        return this.canvas.toDataURL()
    }
    makeImage(data) {
        return new Promise(resolve => {
            const img = new Image()
            img.src = data
            img.onload = () => {
                resolve(img)
            }
        })
    }
}
