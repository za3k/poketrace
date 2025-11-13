const collection = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []}
const pokedex = {}
for (entry of data) {
    pokedex[entry.id] = entry
    for (gen of entry.gens) {
        collection[gen].push(entry.id)
    }
}

const easel = new Easel($(".easel"))

function key(id) {
    return `poketrace-${id}`
}

function save(id, dataUrl) {
    localStorage.setItem(key(id), dataUrl)
}

function load(id) {
    return localStorage.getItem(key(id))
}

var lineThickness = 2
var currentBook = null
var currentPoke = null
function selectPokemon(id) {
    if (currentPoke == id) return
    const pokemon = pokedex[id]
    // TODO: Select in "Pokemon menu"
    // Save any current data
    if (currentPoke) save(id, easel.getData())
    // Don't bother clearing the easel, even if deselecting. Just disable the tab.

    if (id) {
        // Load any stored drawing to edit
        const oldArt = load(id)

        // Display the pokemon in the editor
        const artwork = `data/${getArtwork(pokemon)}`
        $(".art").attr("src", artwork)
        $(".name").text(pokemon.name)
        $(".number").text(pokemon.number)
        easel.draw(lineThickness, oldArt).then(url => {
            save(id, url)
            disableTab("editor")
            selectTab("current-book") // Switch to select a new pokemon
        })
    }
    currentPoke = id
}

function getArtwork(pokemon) {
    const art = pokemon.art
    const preference = ["Sugimori artwork", "Global Link artwork"]
    for (const option of preference) {
        if (art[option]) return art[option]
    }
    return Object.values(art)[0] // Return a random one
}

function selectBook(book) {
    currentBook = book
    $(`.book-link`).removeClass("selected")
    $(`.book-link[data-book=${book}]`).addClass("selected")
    enableTab("current-book")
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
})

selectBook("trace-pokemon")
//selectPokemon('bulbasaur')

