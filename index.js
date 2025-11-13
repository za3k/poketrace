const collection = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []}
const pokedex = {}
for (entry of data) {
    pokedex[entry.id] = entry
    for (gen of entry.gens) {
        collection[gen].push(entry.id)
    }
}

function selectPokemon(id) {
    // TODO: Exit early if that's the already-selected pokemon
    const pokemon = pokedex[id]
    // TODO: Select in "Pokemon menu"
    // TODO: Save and unload any current data
    // TODO: Load any stored drawings
    // Display the pokemon in the editor
    const artwork = `data/${getArtwork(pokemon)}`
    $(".art").attr("src", artwork)
    $(".name").text(pokemon.name)
    $(".number").text(pokemon.number)
}

function getArtwork(pokemon) {
    const art = pokemon.art
    const preference = ["Sugimori artwork", "Global Link artwork"]
    for (const option of preference) {
        if (art[option]) return art[option]
    }
    return Object.values(art)[0] // Return a random one
}

function loadArtwork(href) {
}

// Tab selection in JS (rather than CSS)
$(".main").on("click", ".tab-selector:not(.disabled)", function() {
    const target = $(this).data("target")
    $(".tab-selector, .tab").removeClass("selected")
    $(this).addClass("selected")
    $(`#${target}.tab`).addClass("selected")
})

$(".tab-selector").removeClass("disabled")
//selectProject()
selectPokemon('bulbasaur')

