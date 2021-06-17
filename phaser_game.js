
const cards =  [['caterpillar', 'chrysalis', 'butterfly', 'butterfly_egg'],
                ['tadpole', 'juvenile_frog', 'adult_frog', 'frog_egg'],
                ['germination', 'seedling', 'flowering_plant', 'seed']]

const centers = [[440, 240], [860, 375], [600, 600], [150, 430]]
const starts = [[]]

var sceneIndex // The current scene index

var selected // The currently selected piece

var isMoving // Set to true when a piece is moved
var isBackgroundClick // Set to true when user clicks on the clear background

class Title extends Phaser.Scene {
    constructor() {
        super('title')
    }

    preload () {
        this.load.image('title', 'assets/title.png')
    }

    create() {
        let { width, height } = this.sys.game.canvas
        this.add.image(width/2, height/2, 'title')
            
        new Bubble(this, 100, height / 2 + 200, 'Butterfly', 
            { fontSize: 40 }).setCallback(() => {
                sceneIndex = 0
                this.scene.start('game')
            })
        new Bubble(this, 375, height / 2 + 200, 'Frog', 
            { fontSize: 40 }).setCallback(() => {
                sceneIndex = 1
                this.scene.start('game')
            })
        new Bubble(this, 580, height / 2 + 200, 'Flowering Plant', 
            { fontSize: 40 }).setCallback(() => {
                sceneIndex = 2
                this.scene.start('game')
            })
    }
}

class Game extends Phaser.Scene {

    sprites // The sprites array

    constructor() {
        super('game')
    }

    preload () {
        console.log('preload')
        this.load.image('board', 'assets/board.png')

        cards[sceneIndex].forEach(card => {
            this.load.image(card, 'assets/' + card + '.png')
        })
    }

    create () {
        console.log('create')
        let { width, height } = this.sys.game.canvas
        this.add.image(width/2, height/2, 'board')

        let scale = 0.75

        let x = 100, y = height/2
        this.sprites = []

        cards[sceneIndex].forEach(card => {
            let image = this.add.sprite(0, y, card).setInteractive({
                useHandCursor: true, draggable: true })
            
            this.sprites.push(image)

            // Position it relative to the previous x position
            x += image.displayWidth/2
            image.x = x

            image.on('pointerover',function(pointer){
                image.tint = 0.5 * 0xffffff
            })
            image.on('pointerout',function(pointer){
                image.tint = 0xffffff
            })
            image.on('pointerdown',function(pointer){
                if (selected && selected!=image) {
                    selected.tint = 0xffffff
                }
                selected = image
                selected.tint = 0.5 * 0xffffff
                this.children.bringToTop(selected)
                isMoving = false
                isBackgroundClick = false
            }, this)
            image.on('pointerup',function(pointer){
                isBackgroundClick = false
            }, this)

            x += image.displayWidth/2 + 20
            if (x >= width - 200) {
                y += 300
                x = 100
            }
        })

        //  The pointer has to move 16 pixels before it's considered as a drag
        this.input.dragDistanceThreshold = 16

        this.input.on('dragstart', function (pointer, gameObject) {
            isMoving = true
        })

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX
            gameObject.y = dragY
        })

        this.input.on('dragend', function (pointer, gameObject) {
        })

        this.input.on('pointerdown', function(pointer){
            isBackgroundClick = true
        })
        this.input.on('pointerup', function(pointer){
            if (isBackgroundClick) {
                if (selected) {
                    selected.tint = 0xffffff
                    selected = null
                }
            }
        })

        isMoving = false
        isBackgroundClick = false

        new Bubble(this, width - 330, height - 90, 'Check Answers').setCallback(() => {
            this.checkAnswers()
        })
        new Bubble(this, 100, height - 90, 'Home').setCallback(() => {
            this.scene.start('title')
        })
    }

    checkAnswers() {
        let usedIndex = new Map()
        let tally = 0
        let errors = false

        let spriteIndex = 0
        this.sprites.forEach(sprite => {
            let key = sprite.texture.key

            let index = -1
            let minDist = 99999
            for (let i=0; i<centers.length; i++) {
                let dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, centers[i][0], centers[i][1])
                console.log(dist)
                if (dist < minDist && dist < 100) {
                    minDist = dist
                    index = i
                } 
            }

            console.log(index)
            if (index > -1) {
                if (usedIndex.has(index)) {
                    // two cards are overlapping each other too closely
                    errors = true
                } else {
                    usedIndex.set(index, key)
                    if (index == spriteIndex) {
                        tally += 1
                    }
                }
            } else {
                errors = true
            }

            spriteIndex += 1
        })

        if (errors) {
            this.showCardsPlacingError()
        } else {
            this.showCardsTally(tally)
        }
    }
    
    showCardsPlacingError() {
        // Show 3 second message
        let bubble = new Bubble(this, 300, 400, ' Cards not placed properly! ')
        let timer = this.time.delayedCall(3000, 
            function(bubble) {
                bubble.destroy()
            }, [bubble], this)  // delay in ms
    }

    showCardsTally(tally) {
        // Show 10 second message
        let text = tally.toString() + ' out of 4 correct!'
        let bubble = new Bubble(this, 400, 400, text)
        let timer = this.time.delayedCall(10000, 
            function(bubble) {
                bubble.destroy()
            }, [bubble], this)  // delay in ms
    }
}

let config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        width: 1057,
        height: 793
    },
    backgroundColor: '#FFFFFF',
    scene: [Title, Game]
}

let game = new Phaser.Game(config)
