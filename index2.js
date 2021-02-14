const DIJKSTRA = 0;
const ASTAR = 1;

const manhattan = (s, e) => {
    let [x1, y1] = s.split('-');
    let [x2, y2] = e.split('-');
    return (Number(x2) - Number(x1)) + (Number(y2) - Number(y1));
}

class Grid {
    constructor(x, y, startNode, endNode, speed = 0) {
        this.x = x;
        this.y = y;
        this.startNode = startNode,
        this.endNode = endNode;
        this.nodeList = {};
        this.path = [];
        this.found =[];
        this.speed = speed;
        this.mouseDown = false;
        this.dir = 'r';
        this.started = false;
        this.reset();
        this.reset = this.reset.bind(this);
    }
    addWall(i, j) {
        let coords = `${j}-${i}`;
        let cell = $('#'+coords);
        let className = []
        $(`#${j}-${i-1}`).css('border-bottom', 'none');
        $(`#${j}-${i+1}`).css('border-top', 'none');
        $(`#${j-1}-${i}`).css('border-right', 'none');
        $(`#${j+1}-${i}`).css('border-left', 'none');
        if (this.nodeList[i-1] && this.nodeList[i-1][j] && this.nodeList[i-1][j].blocked) {
            className.push('up');
            $(`#${j}-${i-1} .block`).css('border-bottom', 'none');
        }
        if (this.nodeList[i+1] && this.nodeList[i+1][j] && this.nodeList[i+1][j].blocked) {
            className.push('down');
            $(`#${j}-${i+1} .block`).css('border-top', 'none');
        }
        if (this.nodeList[i] && this.nodeList[i][j-1] && this.nodeList[i][j-1].blocked) {
            className.push('left');
            $(`#${j-1}-${i} .block`).css('border-right', 'none');
        }
        if (this.nodeList[i] && this.nodeList[i][j+1] && this.nodeList[i][j+1].blocked) {
            className.push('right');
            $(`#${j+1}-${i} .block`).css('border-left', 'none');
        }
        $(`#${j}-${i}`).css('border', 'none');
        let block = $('<div class="block">')
        className.forEach(dir => {
            if (dir === 'up') {
                block.css('border-top', 'none');
            } else if (dir === 'down') {
                block.css('border-bottom', 'none');
            } else if (dir === 'left') {
                block.css('border-left', 'none');
            } else if (dir === 'right') {
                block.css('border-right', 'none');
            }
        })
        cell.append(block);
    }
    direction(here) {
        if (this.found.length < 1) return 'r';
        let dir = 'r'
        let last = this.found[this.found.length-1].split('-');
        here = here.split('-');
        // console.log('hm', here, last)
        if (Number(here[0]) - 1 === Number(last[0])) {
            dir = 'r';
        } else if (Number(here[0]) + 1 === Number(last[0])) {
            dir = 'l';
        } else if (Number(here[1]) + 1 === Number(last[1])) {
            dir = 'd';
        } else if (Number(here[1]) - 1 === Number(last[1])) {
            dir = 'u';
        }
        return dir
    }
    node(n) {
        let [x, y] = n.split('-');
        return this.nodeList[Number(y)][Number(x)];
    }
    current(type=0) {
        let least = Infinity;
        let leastIdx = 0;

        for (let i = 0; i < this.queue.length; i++) {
            let here = this.queue[i];
            let score = 0;
            let thisNode = this.node(here);
            if (type === 0) score = thisNode.gScore;
            else if (type === 1) score = thisNode.fScore;
            if (thisNode.dir !== this.direction(here)) score += 1;
            if (score < least) {
                least = score;
                leastIdx = i;
            }
        }
        let current = this.queue[leastIdx];
        this.node(current).found = true
        this.dir = this.direction(current);
        this.found.push(current);
        this.queue.splice(leastIdx, 1);
        return current
    }
    neighbors(n) {
        let [x, y] = n.split('-');
        x = Number(x);
        y = Number(y);
        let neighbors = [];
        if (this.nodeList[y-1] && this.nodeList[y-1][x] && !this.nodeList[y-1][x].blocked && !this.nodeList[y-1][x].found) neighbors.push(`${x}-${y-1}`);
        if (this.nodeList[y+1] && this.nodeList[y+1][x] && !this.nodeList[y+1][x].blocked && !this.nodeList[y+1][x].found) neighbors.push(`${x}-${y+1}`);
        if (this.nodeList[y] && this.nodeList[y][x-1] && !this.nodeList[y][x-1].blocked && !this.nodeList[y][x-1].found) neighbors.push(`${x-1}-${y}`);
        if (this.nodeList[y] && this.nodeList[y][x+1] && !this.nodeList[y][x+1].blocked && !this.nodeList[y][x+1].found) neighbors.push(`${x+1}-${y}`);
        return neighbors;
    }
    gScore(n) {
        return this.node(n).gScore
    }
    setNode(n, data) {
        let [x, y] = n.split('-');
        this.nodeList[y][x] = data;
    }
    dijkstras() {
        if (this.started) return;
        let path = [];
        this.started = true;
        while (this.queue.length) {
            let current = this.current();
            if (current === this.endNode) {
                path = this.finalPath();
                break;
            }
            let neighbors = this.neighbors(current);
            neighbors.forEach(n => {
                let neighbor = this.node(n);
                let gScore = this.node(current).gScore + 1;
                if (gScore < neighbor.gScore) {
                    neighbor.gScore = gScore;
                    neighbor.cameFrom = current;
                    let inQueue = false;
                    for (let i = 0; i < this.queue.length; i++) {
                        if (this.queue[i] === n) {
                            inQueue = true;
                            break;
                        }
                    }
                    if (!inQueue) this.queue.unshift(n);
                }

            })
        }
        return this.animateSearch(path);
    }
    aStar(h) {
        if (this.started) return;
        let path = [];
        this.started = true;
        while (this.queue.length) {
            let current = this.current(ASTAR);
            if (current === this.endNode) {
                path = this.finalPath();
                break;
            }
            let neighbors = this.neighbors(current);
            neighbors.forEach(n => {
                let neighbor = this.node(n);
                let gScore = this.node(current).gScore + 1;
                if (gScore < neighbor.gScore) {
                    neighbor.gScore = gScore;
                    neighbor.fScore = gScore + h(n, this.endNode);
                    neighbor.cameFrom = current;
                    let inQueue = false;
                    for (let i = 0; i < this.queue.length; i++) {
                        if (this.queue[i] === n) {
                            inQueue = true;
                            break;
                        }
                    }
                    if (!inQueue) this.queue.unshift(n);
                }

            })
        }
        return this.animateSearch(path);
    }
    finalPath() {
        let path = [];
        let current = this.node(this.endNode).cameFrom;
        while (current !== this.startNode) {
            path.unshift(current);
            current = this.node(current).cameFrom;
        }
        return path;
    }
    animateSearch(path) {
        let i = 0;
        let searchItv = setInterval(() => {
            if (i >= this.found.length) {
                clearInterval(searchItv);
                return this.animatePath(path);
            }
            if (this.found[i] !== this.startNode && this.found[i] !== this.endNode) $('#'+ this.found[i]).append('<div class="search">');
            i++;
        }, this.speed)
    }
    animatePath(path) {
        let i = 0;
        let pathInterval = setInterval(() => {
            if (i === path.length-1) {
                clearInterval(pathInterval);
                this.animatePacMan(path);
            }
            $('#'+ path[i]).empty();
            $('#'+ path[i]).append('<div class="path">');
            i++;
        }, 50)
    }
    animatePacMan(path) {
        let i = 0;
        let pathInterval = setInterval(() => {
            if (i === path.length) {
                clearInterval(pathInterval);
                $('#'+ this.endNode).empty();
                $('#'+ path[i-1]).empty();
                $('#'+ this.endNode).append('<div class="startNode">');
                return;
            }
            $('#'+ path[i]).empty();
            if (i > 0) $('#'+ path[i-1]).empty(); 
            else {
                console.log('asdfasdfasdfasdfasdf')
                $('#'+this.startNode).empty()
            }
            $('#'+ path[i]).append('<div class="startNode">');
            i++;
        }, 100)
    }
    reset() {
        $('#grid').empty();
        this.nodeList = {};
        this.path = [];
        this.found =[];
        this.queue = [this.startNode];
        this.found = [];
        this.path = [];
        this.started = false;
        for (let i = 0; i < this.y; i++) {
            let row = {};
            for (let j = 0; j < this.x; j++) {
                row[j] = {
                    gScore: Infinity,
                    fScore: Infinity,
                    cameFrom: null,
                    found: false,
                    blocked: false,
                };
                let coords = `${j}-${i}`;
                const cell = $(`<div class="cell" id=${coords}>`);
                cell.on('mousedown', e => {
                    this.mouseDown = true;
                });
                cell.on('mouseup', e => {
                    this.mouseDown = false;
                    if (!this.started && !this.nodeList[i][j].blocked) {
                        this.nodeList[i][j].blocked = true;
                        this.addWall(i, j);
                    }
                });
                cell.on('mouseenter', e => {
                    if (this.mouseDown && !this.started && !this.nodeList[i][j].blocked) {
                        this.nodeList[i][j].blocked = true;
                        this.addWall(i, j);
                    }
                });
                cell.on('mouseleave', e => {
                    if (this.mouseDown && !this.started &&!this.nodeList[i][j].blocked) {
                        this.nodeList[i][j].blocked = true;
                        this.addWall(i, j);
                    }
                });
                cell.on('dragover', e => e.preventDefault())
                cell.on('drop', e => {
                    e.preventDefault();
                    const nodeId = e.dataTransfer.getData('node_id');
                    const dropped = $('#'+nodeId);
                    if (!e.target.id.match(/cell-/)) return dropped.style.display = 'block';
                    if (nodeId === 'startNode') {
                        dropped.style.display = 'block';
                        startNode = e.target.id.split('-')[1];
                        cell.append(dropped);
                    } else if (nodeId === 'endNode') {

                    }
                })
                // add start and end nodes
                let [startX, startY] = this.startNode.split('-');
                let [endX, endY] = this.endNode.split('-');
                if (j === Number(startX) && i === Number(startY)) {
                    const startNode = $('<div id="startNode" class="startNode">');
                    cell.append(startNode);
                }
                if (j === Number(endX) && i === Number(endY)) {
                    const endNode = $('<div id="endNode" class="endNode">');
                    cell.append(endNode);
                }
                if (j === 0) {
                    cell.css('border-left', 'none')
                }
                if (i === y-1) {
                    cell.css('border-bottom', 'none')
                }
                $('#grid').append(cell);
            }
            this.nodeList[i] = row;
        }
        this.setNode(this.startNode, {
            gScore: 0,
            fScore: 0,
            cameFrom: startNode,
            found: true,
        })
    }
}

const grid = $('#grid');

let width = $('#grid').width();
let height = $('#grid').height();
let x = Math.floor(width / 25);
let y = Math.floor(height/25);

$('#grid').css('grid-template-columns', `repeat(${x}, 1fr)`).css('grid-template-rows', `repeat(${y}, 1fr)`);


let GRID = new Grid(x, y, `0-0`, `${x-1}-${y-1}`, 0)
let algorithm = DIJKSTRA;

// $('#'+newGrid.startNode).css('background-color', 'green')
// $('#'+newGrid.endNode).css('background-color', 'red')

$('#dijkBtn').on('click', function() {
    algorithm = DIJKSTRA;
    $(this).addClass('selected');
    $('#astarBtn').removeClass('selected');
})
$('#astarBtn').on('click', function() {
    algorithm = ASTAR;
    console.log($(this))
    $(this).addClass('selected');
    $('#dijkBtn').removeClass('selected');
})

$('#startBtn').on('click', () => {
    if (algorithm === ASTAR) {
        GRID.aStar(manhattan);
    } else {
        GRID.dijkstras();
    }
})

$('#speedSelect').on('change', function() {
    GRID.speed = $(this).val();
})

$('#clearBtn').on('click', GRID.reset)

$('#instBtn').on('click', () => {
    $('#instructions').hide();
})