
const animalNames = [
  "albatross",
  "alligator",
  "alpaca",
  "anteater",
  "antelope",
  "armadillo",
  "baboon",
  "badger",
  "bald eagle",
  "bat",
  "bear",
  "beaver",
  "bird",
  "bison",
  "black bear",
  "boa",
  "boa constrictor",
  "boar",
  "buffalo",
  "butterfly",
  "camel",
  "capybara",
  "cat",
  "cheetah",
  "chimpanzee",
  "chipmunk",
  "cobra",
  "cow",
  "coyote",
  "crab",
  "crane",
  "crocodile",
  "crow",
  "deer",
  "dog",
  "dolphin",
  "dove",
  "dragonfly",
  "duck",
  "eagle",
  "echidna",
  "elephant",
  "elk",
  "emu",
  "falcon",
  "ferret",
  "fish",
  "flamingo",
  "flicker",
  "fox",
  "gazelle",
  "gecko",
  "giraffe",
  "gnu",
  "goat",
  "goose",
  "gorilla",
  "grizzly bear",
  "groundhog",
  "gull",
  "harbor seal",
  "hawk",
  "hedgehog",
  "hen",
  "hippopotamus",
  "honey badger",
  "hyena",
  "iguana",
  "insect",
  "jackal",
  "jaguar",
  "kangaroo",
  "killer whale",
  "koala",
  "komodo dragon",
  "lemming",
  "lemur",
  "leopard",
  "lion",
  "lizard",
  "llama",
  "lynx",
  "magpie",
  "manatee",
  "mockingbird",
  "mongoose",
  "monkey",
  "moose",
  "mouse",
  "opossum",
  "orca",
  "ostrich",
  "otter",
  "owl",
  "ox",
  "peacock",
  "pelican",
  "penguin",
  "pigeon",
  "platypus",
  "porcupine",
  "possum",
  "puma",
  "python",
  "rabbit",
  "raccoon",
  "rat",
  "rattlesnake",
  "rhinoceros",
  "salmon",
  "seal",
  "sea lion",
  "shark",
  "sheep",
  "skunk",
  "sloth",
  "snake",
  "sparrow",
  "spider",
  "squirrel",
  "starfish",
  "swan",
  "tapir",
  "tarantula",
  "tiger",
  "tortoise",
  "turkey",
  "turtle",
  "viper",
  "vulture",
  "wagtail",
  "wallaby",
  "whale",
  "wolf",
  "wombat",
  "woodpecker",
  "yak",
  "zebra"
]

const adjectives = [
    "ancient","antique","aquatic","baby","basic","big","bitter","black","blue","bottle","bottled","brave","breezy","bright","brown","calm","charming","cheerful","chummy","classy","clear","clever","cloudy","cold","cool","crispy","curly","daily","deep","delightful","dizzy","down","dynamic","elated","elegant","excited","exotic","fancy","fast","fearless","festive","fluffy","fragile","fresh","friendly","funny","fuzzy","gentle","gifted","gigantic","graceful","grand","grateful","great","green","happy","heavy","helpful","hot","hungry","husky","icy","imaginary","invisible","jagged","jolly","joyful","joyous","kind","large","light","little","lively","lovely","lucky","lumpy","magical","manic","melodic","mighty","misty","modern","narrow","new","nifty","noisy","normal","odd","old","orange","ordinary","painless","pastel","peaceful","perfect","phobic","pink","polite","precious","pretty","purple","quaint","quick","quiet","rapid","red","rocky","rough","round","royal","rugged","rustic","safe","sandy","shiny","silent","silky","silly","slender","slow","small","smiling","smooth","snug","soft","sour","strange","strong","sunny","sweet","swift","thirsty","thoughtful","tiny","uneven","unusual","vanilla","vast","violet","warm","watery","weak","white","wide","wild","wilde","windy","wise","witty","wonderful","yellow","young","zany"
]

export enum ObfuscationStyle { URLStyle, NAME, LONGNAME }

export function obfuscate(str: string) {
    return obfuscateStyle(str, ObfuscationStyle.NAME);
}

export function obfuscateStyle(str: string, style: ObfuscationStyle) {
    switch (style) {
        case ObfuscationStyle.URLStyle:
            const hostElements = str.split(".");
            if (hostElements.length <= 2) {
                const has = myhash(str);
                return `${adjectives[Math.floor(has/animalNames.length)]}.${animalNames[has % animalNames.length]}`
            }
            let result = ""
            for (let i = 0; i < hostElements.length-1; i++) {
                result+=(adjectives[myhash(str+hostElements[i]) % adjectives.length] + ".")
            }
            return result + animalNames[myhash(str+hostElements[-1]) % animalNames.length]
        case ObfuscationStyle.LONGNAME:
            const elements = str.split("-");
            if (elements.length <= 2) {
                return obfuscate(str);
            }
            let res = ""
            for (let i = 0; i < elements.length-1; i++) {
                res+=(adjectives[myhash(str+elements[i]) % adjectives.length] + "-")
            }
            return res + animalNames[myhash(str+elements[-1]) % animalNames.length]
        case ObfuscationStyle.NAME:
            let what = myhash(str) % adjectives.length * animalNames.length;
            return `${adjectives[Math.floor(what / animalNames.length)]}-${animalNames[what % animalNames.length]}`
    }

}

function myhash(source: string) {
  let hash = 0, i, chr;
  if (source.length === 0) return hash;
  for (i = 0; i < source.length; i++) {
    chr = source.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
