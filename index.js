var lineThickness = 2
var currentBook = null
var currentPoke = null
const collection = {} // Generations
const pokedex = {}

const easel = new Easel($(".easel"))

function key(id) {
    return `poketrace-${currentBook}-${id}`
}

function save(id, dataUrl) {
    localStorage.setItem(key(id), dataUrl)
    updatePokemon(id)
}

function load(id) {
    return localStorage.getItem(key(id))
}

function selectPokemon(id) {
    if (currentPoke == id) return
    const pokemon = pokedex[id]

    // Select in "Pokemon menu"
    $(".pokemon-link").removeClass("selected")
    $(`.pokemon-link[data-id=${id}]`).addClass("selected")

    // Save any current data
    if (currentPoke && !easel.isEmpty()) {
        save(currentPoke, easel.getData())
    }

    // Clear the easel
    easel.clear()

    if (id) {
        enableTab("editor")

        // Load any stored drawing to edit
        const oldArt = load(id)

        // Display the pokemon in the editor
        const artwork = getArtwork(pokemon)
        $(".art").attr("src", artwork)
        $(".name").text(pokemon.name)
        $(".number").text(pokemon.number)
        easel.draw(lineThickness, oldArt).then(url => {
            if (!easel.isEmpty()) save(id, url)
            disableTab("editor")
            enableTab("current-book")
            selectTab("current-book") // Switch to select a new pokemon
        })
        // There's a bug where if you don't click "Done" and select another pokemon, the new one also tets the second art. To work around it, we just force you to hit "Done" to continue. It's hack-a-day!
        selectTab("editor")
        disableTab("current-book")
    }
    currentPoke = id
}

function exportHTML() {
    const div = $("<div></div>")
    var count = 0
    for (const id of collection[1]) { // Base 151 only
        const disp = getDisplay(id)
        const pokemon = pokedex[id]
        if (!disp.startsWith("data:")) continue // We only want to show hand-drawn ones
        const e = $(`
            <div class="pokemon" data-id="${id}">
                <img src="${disp}">
                <span>${pokemon.number}: ${pokemon.name}</span>
            </div>
        `)
        div.append(e)
        count += 1
    }
    if (count == 0) {
        alert("To export, first draw some pokemon.")
        return
    }

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <style>
                body {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, 150px);
                    gap: 4px;
                    justify-content: center;
                }

                body > div {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid lightgrey;
                    padding: 4px;
                    position: relative;
                    font-size: 10pt;
                }

                img {
                    max-width: 100%;
                    max-height: 100%;
                    min-height: 0;
                    flex: 1 1;
                    object-fit: contain;
                }

                span {
                    display: block;
                    text-align: center;
                    overflow: hidden;
                    flex-shrink: 0;
                    white-space: nowrap;
                    font-size: 12px;
                    text-overflow: ellipsis;
                    margin-top: 4px
                }
                </style>
            </head>
            <body>${div[0].innerHTML}</body>
        </html>`
    var newWindow = window.open()
    newWindow.document.write(html)
}

function getArtwork(pokemon) {
    const art = pokemon.art
    const preference = ["Sugimori artwork", "Global Link artwork"]
    for (const option of preference) {
        if (art[option]) return `data/${art[option]}`
    }
    return `data/${Object.values(art)[0]}` // Return a random one
}

function selectBook(book) {
    if (currentBook == book) return
    currentBook = book
    $(`.book-link`).removeClass("selected")
    $(`.book-link[data-book=${book}]`).addClass("selected")
    enableTab("current-book")

    $(".trace-area .art").hide()
    var instructions = ""
    if (book == "trace-pokemon") {
        $(".trace-area .art").show()
        instructions = 'Trace <span class="name">the pokemon</span>'
    } else if (book == "fanart-pokemon") {
        instructions = 'Draw a picture of <span class="name">the pokemon</span>'
    } else if (book == "color-pokemon") {
        instructions = 'Color <span class="name">the pokemon</span>'
    }
    $(".instructions").html(instructions)

    clearPokemon()
    currentPokemon = null
    for (const id of collection[1]) { // Base 151 only
        addPokemon(id)
    }
}

function getDisplay(id) {
    return load(id) || getArtwork(pokedex[id])
}

function addPokemon(id) {
    const pokemon = pokedex[id]
    const e = $(`
        <div class="pokemon-link" data-id="${id}">
            <img src="${getDisplay(id)}">
            <span>${pokemon.name}</span>
        </div>
    `)
    $(".pokemon-container").append(e)
}
function updatePokemon(id) {
    $(`.pokemon-link[data-id=${id}] img`).attr('src', getDisplay(id))
}
function clearPokemon(id) {
    $(".pokemon-container").empty()
}

function selectTab(tab) {
    $(".tab-selector, .tab").removeClass("selected")
    $(`.tab-selector[data-target=${tab}]`).addClass("selected")
    $(`#${tab}.tab`).addClass("selected")
}

function disableTab(tab) {
    $(`.tab-selector[data-target=${tab}]`).addClass("disabled")
}

function enableTab(tab) {
    $(`.tab-selector[data-target=${tab}]`).removeClass("disabled").addClass("unlocked")
}

// Tab selection in JS (rather than CSS)
$(".main").on("click", ".tab-selector:not(.disabled)", function() {
    const target = $(this).data("target")
    selectTab(target)
}).on("click", ".book-link", function() {
    selectBook($(this).data("book"))
}).on("click", ".pokemon-link", function() {
    selectPokemon($(this).data("id"))
}).on("click", ".export", exportHTML)

async function main() {
    const data = await (await fetch("data/pokedex.json")).json()

    for (entry of data) {
        pokedex[entry.id] = entry
        for (gen of entry.gens) {
            collection[gen] ||= []
            collection[gen].push(entry.id)
        }
    }

    selectBook("trace-pokemon")
}
main()
