// dom elements
const grid = document.getElementById('grid');
const startBtn = document.getElementById('startBtn');

// event listeners

startBtn.addEventListener('click', dijkstras)
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mouseup', mouseUp);
document.addEventListener('mousemove', mouseEnter);
document.ondrop = e => {
    e.preventDefault();
    let nodeid = e.dataTransfer.getData('node_id');
    console.log('here')
}

let clicking = false;

function mouseDown(e) {
    let id = e.target.id;
    if (!id.match(/cell/)) return;
    clicking = true;
}

function mouseUp(e) {
    let idRaw = e.target.id;
    clicking = false;
    if (!idRaw.match(/cell-/)) return;
    let id = idRaw.replace('cell-', '');
    if (!blocked.includes(Number(id))) {
        blocked.push(parseInt(id));
        let thisCell = document.getElementById(idRaw);
        let blockEl = document.createElement('div');
        blockEl.className = 'block';
        thisCell.append(blockEl)
    }
}

function mouseEnter(e) {
    let idRaw = e.target.id;
    if (!idRaw || !idRaw.match(/cell-/) || !clicking) return;
    let id = idRaw.replace('cell-', '');
    if (!blocked.includes(Number(id))) {
        console.log('hello', idRaw)
        blocked.push(parseInt(id));
        let thisCell = document.getElementById(idRaw);
        let blockEl = document.createElement('div');
        blockEl.className = 'block';
        thisCell.append(blockEl)
    }
}

//state

let startNode = 0;
let endNode = 0;
let gridX = 0;
let gridY = 0;


let queue = [];
let gScore = {}
let fScore = {};
let cameFrom = {};
let blocked = [19, 172];
let found = [];
let path = [];
let current = null;
let direction = null;
let nodeList = {
}

let searching = false;

// function
function reset(width=null, height=null) {
    console.log('width: ', width)
    console.log('height: ', height)
    let cells = [];
    grid.innerHTML = '';
    if (width) {
        gridX = width;
        gridY = height;
        endNode = 473;
        // endNode = width*height-1;
    }
    for (let i = 0; i < gridX*gridY; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.flexBasis = `calc(${100/(gridX)}% - 2px)`;
        cell.id = `cell-${i}`;
        cell.ondragover = e => e.preventDefault();
        cell.ondrop = e => {
            e.preventDefault();
            const nodeId = e.dataTransfer.getData('node_id');
            const dropped = document.getElementById(nodeId);
            console.log('d', dropped)
            if (!e.target.id.match(/cell-/)) return dropped.style.display = 'block';
            if (nodeId === 'startNode') {
                dropped.style.display = 'block';
                startNode = e.target.id.split('-')[1];
                cell.append(dropped);
            } else if (nodeId === 'endNode') {

            }
        };
        grid.append(cell);
        if (i === startNode) {
            cells.push('start');
            
            let startNodeEl = document.createElement('div');
            startNodeEl.className = 'startNode';
            startNodeEl.id = 'startNode';
            startNodeEl.draggable = true;
            startNodeEl.ondragover = e => e.stopPropagation();
            startNodeEl.ondragstart = e => {
                const target = e.target;
                if (target.id !== 'startNode' && target.id !== 'endNode') return;
                console.log('hello')
                e.dataTransfer.setData('node_id', target.id);
                setTimeout(() => {
                    target.style.display = 'none'
                }, 0);
            };
            cell.append(startNodeEl);
        } else if (i === endNode) {
            cells.push('end');
            let endNodeEl = document.createElement('div');
            endNodeEl.className = 'endNode';
            endNodeEl.id = 'end';
            cell.append(endNodeEl);
        } else {
            cells.push(null);
        }
        gScore[i] = {
            cost: Infinity,
            direction: null
        };

        nodeList[i] = {
            gScore: Infinity,
            fScore: null,
            dir: null,
        }
    }
    queue = [];
    fScore = {};
    gScore[startNode] = {
        cost: 0,
        direction: 'right'
    };
    // nodeList[startNode] = {
    //     gScore: 0,
    //     fScore: 0,
    //     cameFrom: 0,
    //     dir: 'right',
    //     found: true,
    // }
    cameFrom[startNode] = startNode;
    blocked = [];
    found = [];
    path = [];
    searching = false;
}

function dijkstras() {
    if (searching) return reset();
    searching = true;
    queue = [startNode];
    nodeList[startNode] = {
        gScore: 0,
        cameFrom: startNode,
        dir: 'right',
        found: true,
    }
    current = startNode;
    direction = nodeList[current].dir;

    let dijkInterval =  setInterval(() => {
        if (!queue.length) {
            clearInterval(dijkInterval);
            return console.log('couldn\'t find a path');
        }
        let least = nodeList[queue[0]].gScore + (nodeList[queue[0]].dir === direction ? 1 : 0);
        let leastIdx = 0;
        queue.forEach((q, i) => {
            let val = nodeList[q].gScore;
            if (val < least) {
                least = val;
                leastIdx = i;
            }
        });
        current = queue[leastIdx];
        if (current === endNode) {
            clearInterval(dijkInterval);
            let nextP = nodeList[current].cameFrom;
            let path = [];
            console.log(nodeList);
            while (nextP !== startNode) {
                path.push(nextP);
                nextP = nodeList[nextP].cameFrom;
            }
            let pathInterval = setInterval(() => {
                console.log('path');
                if (!path.length) return clearInterval(pathInterval);
                let cellEl = document.getElementById(`cell-${path[path.length-1]}`);
                let pathEl = document.createElement('div');
                pathEl.className = 'path';
                cellEl.append(pathEl);
                path.pop();
            }, 0)
            return;
        }
        queue.splice(leastIdx, 1);
        nodeList[current].found = true;
        direction = nodeList[current].dir;
        let neighbors = getNeighbors(current);
        neighbors.forEach(node => {
            let [n, dir] = node;
            if (nodeList[n].found) return;
            let cost = nodeList[current].gScore + 1;
            if (cost < nodeList[n].gScore) {
                nodeList[n] = {
                    gScore: cost,
                    cameFrom: current,
                    dir,
                }
                let found = false;
                for (let i = 0; i < queue.length; i++) {
                    if (queue[i] === n) {
                        found = true;
                        break;
                    }
                }
                if (!found) queue.unshift(n);
            }
            if (current !== startNode) {
                let thisCell = document.getElementById(`cell-${current}`);
                let foundEl = document.createElement('div');
                foundEl.className = 'found';
                foundEl.innerHTML = nodeList[current].gScore;
                thisCell.append(foundEl)
            }
        })
    }, 10);
}

function newAStar() {
    if (searching) return reset();
    searching = true;
    queue = [startNode];
    nodeList[startNode] = {
        gScore: 0,
        fScore: 0,
        cameFrom: startNode,
        dir: 'right',
        found: true,
    }
    current = startNode;
    direction = nodeList[current].dir;

    let newInterval = setInterval(() => {
        if (!queue.length) {
            clearInterval(newInterval);
            return console.log('couldn\'t find a path!');
        }
        // assign least fScore in queue to current (looking in current direction first)
        let least = nodeList[queue[0]].fScore +(nodeList[queue[0]].dir === direction ? 0 : 1);
        let leastIdx = 0;
        queue.forEach((q, i) => {
            let val = nodeList[q].fScore + (nodeList[q].dir === direction ? 0 : 1);
            if (val < least) {
                least = val;
                leastIdx = i;
            }
        });
        current = queue[leastIdx];
        console.log('current: ', current)
        if (current === endNode) {
            clearInterval(newInterval);
            // let nextP = cameFrom[current];
            let nextP = nodeList[current].cameFrom;
            let path = [];
            console.log(nodeList);
            while (nextP !== startNode) {
                path.push(nextP);
                nextP = nodeList[nextP].cameFrom;
            }
            let pathInterval = setInterval(() => {
                console.log('path');
                if (!path.length) return clearInterval(pathInterval);
                let cellEl = document.getElementById(`cell-${path[path.length-1]}`);
                let pathEl = document.createElement('div');
                pathEl.className = 'path';
                cellEl.append(pathEl);
                path.pop();
            }, 0)
            return;
        }
        queue.splice(leastIdx, 1);
        nodeList[current].found = true;
        direction = nodeList[current].dir;
        console.log('d', direction)
        let neighbors = getNeighbors(current);
        neighbors.forEach(node => {
            let [n, dir] = node;
            if (nodeList[n].found) return;
            // let cost = nodeList[current].gScore + (dir === nodeList[current].dir === direction ? 1 : 2);
            let cost = nodeList[current].gScore + 1// + (dir === nodeList[current].dir === direction ? 1 : 2);
            if (cost < nodeList[n].gScore) {
                nodeList[n] = {
                    gScore: cost,
                    fScore: cost + getFScore(n),
                    cameFrom: current,
                    dir
                };
                // fScore[n] = getFScore(n)
                // fScore[n] = gScore[n].cost + getFScore(n)
                let found = false;
                for (let i = 0; i < queue.length; i++) {
                    if (queue[i] === n) {
                      found = true;
                      break;
                    }
                  }
                  if (!found) queue.unshift(n);
            }
        })
        if (current !== startNode) {
            let thisCell = document.getElementById(`cell-${current}`);
            let foundEl = document.createElement('div');
            foundEl.className = 'found';
            foundEl.innerHTML = nodeList[current].fScore;
            thisCell.append(foundEl)
        }
    }, 10);
}

function aStar() {
    if (searching) return;
    document.getElementById('computing').innerHTML = 'Computing'
    searching = true;
    queue = [startNode];
    fScore[startNode] = getFScore(startNode);
    current = queue[0];
    let aStartInterval = setInterval(() =>{
        if (!queue.length) clearInterval(aStartInterval);
        document.getElementById('computing-dots').innerHTML += '.'
        let direction = nodeList[current].dir;
        
        // assign least fScore in queue to current
        // let least = fScore[queue[0]] + gScore[queue[0]].direction === direction ? 0 : 1;
        let least = nodeList[queue[0]].fScore //+ (nodeList[queue[0]].dir == direction ? 0 : 1);
        let leastIdx = 0;
        queue.forEach((q, i) => {
            // let val = fScore[q] + gScore[q].direction === direction ? 0 : 1;
            let val = nodeList[q].fScore //+ (nodeList[q].dir === direction ? 0 : 1);
            if (val < least) {
                least = val;
                leastIdx = i;
            }
        });
        current = queue[leastIdx];
        console.log('curent: ', current)
        if (current === endNode) {
            clearInterval(aStartInterval);
            // let nextP = cameFrom[current];
            let nextP = nodeList[current].cameFrom;
            let path = [];
            console.log(nodeList);
            while (nextP !== startNode) {
                path.push(nextP);
                nextP = nodeList[nextP].cameFrom;
                console.log('nextp: ', nextP)
            }
            let pathInterval = setInterval(() => {
                if (!path.length) return clearInterval(pathInterval);
                let cellEl = document.getElementById(`cell-${path[path.length-1]}`);
                let pathEl = document.createElement('div');
                pathEl.className = 'path';
                cellEl.append(pathEl);
                path.pop();
            }, 100)
            return;
        }
        console.log('directoin: ', direction)
        queue.splice(leastIdx, 1);
        nodeList[current].found = true;
        let neighbors = getNeighbors(current);
        neighbors.forEach(node => {
            let [n, dir] = node;
            if (nodeList[n].found) return;
            // let cost = nodeList[current].gScore + (dir === nodeList[current].dir === direction ? 1 : 2);
            let cost = nodeList[current].gScore + 1// + (dir === nodeList[current].dir === direction ? 1 : 2);
            if (cost < gScore[n].cost) {
                nodeList[n] = {
                    gScore: cost,
                    fScore: cost + getFScore(n)*2,
                    cameFrom: current,
                    dir
                };
                nodeList[n].cameFrom = current;
                // fScore[n] = getFScore(n)
                // fScore[n] = gScore[n].cost + getFScore(n)
                let found = false;
                for (let i = 0; i < queue.length; i++) {
                    if (queue[i] === n) {
                      found = true;
                      break;
                    }
                  }
                  if (!found) queue.push(n);
            }
        })
        if (current !== startNode) {
            let thisCell = document.getElementById(`cell-${current}`);
            let foundEl = document.createElement('div');
            foundEl.className = 'found';
            foundEl.innerHTML = nodeList[current].fScore;
            thisCell.append(foundEl)
        }
    }, 10)
}

function getFScore(node) {
    let cost = 0
    while (node !== endNode) {
        if (endNode%gridX === node%gridX) { // vertically alligned
            if (endNode > node) { // endNode down
                node += gridX;
            } else { // endNode up
                node -= gridX;
            }
        } else if (endNode%gridX > node%gridX) { // endNode to the right
            node++;
        } else { // endNode to the left
            node--
        }
        cost++;
    }
    return cost;
}

function getNeighbors(id, dir='r') {
    let neighbors = [];
    
    let up = id-gridX;
    let down = id+gridX;
    let left = id-1;
    let right = id+1;
    let upRight = right-gridY;
    let upLeft = left-gridY;
    let downLeft = left+gridY;
    let downRight = right+gridY;
    // //check downright
    // if (Math.floor((downRight)/gridSize) === Math.floor((id+gridSize)/gridSize) && downRight < gridSize**2 && isAvailable(downRight, taken)) neighbors.push(downRight);  
    // //check downleft
    // if (Math.floor((downLeft)/gridSize) === Math.floor((id+gridSize)/gridSize) && downLeft < gridSize**2 && isAvailable(downLeft, taken)) neighbors.push(downLeft);  
    // //check upright
    // if (Math.floor((upRight)/gridSize) === Math.floor((id-gridSize)/gridSize) && upRight >= 0 && isAvailable(upRight, taken)) neighbors.push(upRight);  
    // //check upleft
    // if (Math.floor((upLeft)/gridSize) === Math.floor((id-gridSize)/gridSize) && upLeft >= 0 && isAvailable(upLeft, taken)) neighbors.push(upLeft);  

    if (dir === 'r') {
        //check right
        if (Math.floor(right/gridX) === Math.floor(id/gridX) && isAvailable(right)) neighbors.push([right, 'right']);  
        //check down
        if (down < gridX*gridY && isAvailable(down)) neighbors.push([down, 'down']);
        //check up
        if (up >= 0 && isAvailable(up)) neighbors.push([up, 'up']);
        //check left
        if (Math.floor(left/gridX) === Math.floor(id/gridX) && isAvailable(left)) neighbors.push([left, 'left']);  
    } else if (dir === 'u') {
        //check up
        if (up >= 0 && isAvailable(up)) neighbors.push(up);
        //check right
        if (Math.floor(right/gridX) === Math.floor(id/gridX) && isAvailable(right)) neighbors.push(right);  
        //check down
        if (down < gridX*gridY && isAvailable(down)) neighbors.push(down);
        //check left
        if (Math.floor(left/gridX) === Math.floor(id/gridX) && isAvailable(left)) neighbors.push(left);  
    } else if (dir === 'd') {
        //check down
        if (down < gridX*gridY && isAvailable(down)) neighbors.push(down);
        //check right
        if (Math.floor(right/gridX) === Math.floor(id/gridX) && isAvailable(right)) neighbors.push(right);  
        //check up
        if (up >= 0 && isAvailable(up)) neighbors.push(up);
        //check left
        if (Math.floor(left/gridX) === Math.floor(id/gridX) && isAvailable(left)) neighbors.push(left);  
    } else {
        //check left
        if (Math.floor(left/gridX) === Math.floor(id/gridX) && isAvailable(left)) neighbors.push(left);  
        //check down
        if (down < gridX*gridY && isAvailable(down)) neighbors.push(down);
        //check right
        if (Math.floor(right/gridX) === Math.floor(id/gridX) && isAvailable(right)) neighbors.push(right);  
        //check up
        if (up >= 0 && isAvailable(up)) neighbors.push(up);
    }


    return neighbors;
}

function isAvailable(id) {
    for (let i = 0; i < blocked.length; i++) {
        if (blocked[i] === id) return false;
    }
    return true;
}

// On initial load

const width = grid.offsetWidth
const x = Math.floor(width/25);
let y = Math.floor(width/x);

reset(x, y);